/**
 * Created by Malcom on 9/11/2016.
 */

var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var ConsultingHourController = require('../controllers/'+apiVersion+ '/consulting-hour');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

router.route('/consulting-hours')
    .post(ConsultingHourController.create)
    .get(ConsultingHourController.find);


/*consulting_hour_id param*/
router.param('consulting_hour_id',ConsultingHourController.consultingHourIdParam);
router.route('/consulting-hours/:consulting_hour_id')
    .get(ConsultingHourController.findOne)
    .put(ConsultingHourController.update)
    .delete(ConsultingHourController.delete);
module.exports = router;