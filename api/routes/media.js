/**
 * Created by Malcom on 4/23/2017.
 */

var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var aws = require('aws-sdk');
var uuid = require('node-uuid');
var _ = require('underscore');
var multerS3 = require('multer-s3');
var url = require('url');
var helper = require('../utils/helper');

var apiVersion = 'v'+process.env.API_VERSION;
var MediaController = require('../controllers/'+apiVersion+ '/media');
var checkToken = require('../../api/middlewares/auth_token');

const s3 = new aws.S3(config.get('aws.credentials'));

const uploadMedia = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.get('aws.bucket'),
        metadata: function(req, file, cb) {
            cb(null, {fieldName: file.fieldname, mimetype: file.mimetype});
        },
        key: function(req, file, cb) {
            let ext = file.originalname.split(".").pop();
            if (file.fieldname && file.fieldname.toLowerCase() == 'media') {
                let fileName = uuid.v1()+'_'+Date.now().toString() + "." + ext;
                let mediaPrefix = "media/" + (file.mimetype.toLowerCase().startsWith("image") ? "images" : "videos") + "/" + fileName;
                cb(null, mediaPrefix);
            }
        }
    }),
    fileFilter: function(req, file, cb) {
        cb(null, file.fieldname && file.fieldname.toLowerCase() == 'media');
    }
}).array('media');



//Middleware to check authorization token
router.use(checkToken);

/*media_id param*/
//router.param('media_id',MediaController.mediaIdParam);
/*router.route('/media/:media_id')
    .get(MediaController.findOne)
    .put(MediaController.update)
    .delete(MediaController.delete);*/
router.route('/media')
    .post(uploadMedia,MediaController.create)
    .get(MediaController.find);

module.exports = router;