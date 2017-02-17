/**
 * Created by Malcom on 9/2/2016.
 */
var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var DoctorController = require('../controllers/'+apiVersion+ '/doctor');
var checkToken = require('../../api/middlewares/auth_token');

//Middleware to check authorization token
router.use(checkToken);

router.route('/doctors')
    //.post(DoctorController.create)
    .get(DoctorController.find);

/*doctor_id param*/
router.param('doctor_id',DoctorController.doctorIdParam);
router.route('/doctors/:doctor_id')
    .get(DoctorController.findOne)
    .put(DoctorController.update)
    .delete(DoctorController.delete);
module.exports = router;