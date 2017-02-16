/**
 * Created by Malcom on 9/11/2016.
 */

var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var DoctorRequestController = require('../controllers/'+apiVersion+ '/doctor-request');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

router.route('/doctor-requests')
    .post(DoctorRequestController.create)
    .get(DoctorRequestController.find);
router.post('/doctor-requests/approve',DoctorRequestController.approve);


/*doctor_request_id param*/
router.param('doctor_request_id',DoctorRequestController.doctorRequestIdParam);
router.route('/doctor-requests/:doctor_request_id')
    .get(DoctorRequestController.findOne)
    .put(DoctorRequestController.update)
    .delete(DoctorRequestController.delete);
module.exports = router;

