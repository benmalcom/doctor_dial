/**
 * Created by Malcom on 9/11/2016.
 */
var config = require('config');
var router = require('express').Router();
var apiVersion = 'v'+process.env.API_VERSION;
var AppointmentController = require('../controllers/'+apiVersion+ '/appointment');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

/*appointment_id param*/
router.param('appointment_id',AppointmentController.appointmentIdParam);

router.route('/appointments/:appointment_id')
    .get(AppointmentController.findOne)
    .put(AppointmentController.update)
    .delete(AppointmentController.delete);
router.route('/appointments')
    .post(AppointmentController.create)
    .get(AppointmentController.find);

module.exports = router;