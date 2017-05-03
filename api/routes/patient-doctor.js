/**
 * Created by Malcom on 4/23/2017.
 */

var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var PatientDoctorController = require('../controllers/'+apiVersion+ '/patient-doctor');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);



/*patient_doctor_id param*/
router.param('my_doctor_id',PatientDoctorController.patientDoctorIdParam);
router.route('/patient-doctors/:patient_doctor_id')
    .get(PatientDoctorController.findOne)
    .delete(PatientDoctorController.delete);

router.get('/doctors/me',PatientDoctorController.findMyDoctors);
router.post('/patient-doctors',PatientDoctorController.create);
module.exports = router;