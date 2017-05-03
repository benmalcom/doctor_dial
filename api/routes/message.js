/**
 * Created by Malcom on 4/23/2017.
 */

var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var MessageController = require('../controllers/'+apiVersion+ '/message');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

router.route('/messages')
    .post(MessageController.create)
    .get(MessageController.find);

/*message_id param*/
router.param('message_id',MessageController.messageIdParam);
router.route('/messages/:message_id')
    .get(MessageController.findOne)
    .put(MessageController.update)
    .delete(MessageController.delete);
module.exports = router;