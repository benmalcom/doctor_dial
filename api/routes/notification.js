/**
 * Created by Malcom on 5/13/2017.
 */

var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var NotificationController = require('../controllers/'+apiVersion+ '/notification');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

router.route('/notifications')
    .post(NotificationController.create)
    .get(NotificationController.find);


/*notification_id param*/
router.param('notification_id',NotificationController.notificationIdParam);
router.route('/notifications/:notification_id')
    .get(NotificationController.findOne)
    .put(NotificationController.update)
    .delete(NotificationController.delete);
module.exports = router;
