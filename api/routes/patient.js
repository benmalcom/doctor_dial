/**
 * Created by Malcom on 9/2/2016.
 */
var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var PatientController = require('../controllers/'+apiVersion+ '/patient');
var checkToken = require('../../api/middlewares/auth_token');

//Middleware to check authorization token
router.use(checkToken);

/*patient_id param*/
router.param('patient_id',PatientController.patientIdParam);
router.route('/patients/:patient_id')
    .get(PatientController.findOne)
    .put(PatientController.update)
    .delete(PatientController.delete);
router.get('/patients',PatientController.find);
router.post('/patients/:patient_id/avatar',PatientController.updateAvatar);
module.exports = router;