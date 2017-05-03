/**
 * Created by Malcom on 9/2/2016.
 */
var config = require('config');
var router = require('express').Router();
var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');
var apiVersion = 'v'+process.env.API_VERSION;
var UserController = require('../controllers/'+apiVersion+ '/user');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);


var s3 = new aws.S3(config.get('aws.credentials'));
var uploadAvatar = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.get('aws.bucket'),
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            var ext = file.originalname.split(".").pop();
            var prefix = "avatars/" +req.userId+"."+ext;
            cb(null, prefix);
        }
    })
});
//Middleware to check authorization token
router.use(checkToken);
/*user_id param*/
router.param('user_id',UserController.userIdParam);
router.route('/users/:user_id')
    .get(UserController.findOne)
    .put(UserController.update);
router.get('/users',UserController.find)
    .post('/users/avatar',uploadAvatar.single('avatar'),UserController.uploadAvatar);

/*router.route('/users/:user_id/doctors/:doctor_id')
    .get(UserController.getDoctor)
    .put(UserController.updateDoctor)
    .delete(UserController.deleteDoctor);
router.route('/users/:user_id/patients/:patient_id')
    .get(UserController.getPatient)
    .put(UserController.updatePatient)
    .delete(UserController.deletePatient);*/

module.exports = router;