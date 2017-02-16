/**
 * Created by Malcom on 9/21/2016.
 */

var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var SubSpecialtyController = require('../controllers/'+apiVersion+ '/sub-specialty');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

router.route('/sub-specialties')
    .post(SubSpecialtyController.create)
    .get(SubSpecialtyController.find);

/*specialty_id param*/
router.param('sub_specialty_id',SubSpecialtyController.subSpecialtyIdParam);
router.route('/sub-specialties/:sub_specialty_id')
    .get(SubSpecialtyController.findOne)
    .put(SubSpecialtyController.update)
    .delete(SubSpecialtyController.delete);
module.exports = router;