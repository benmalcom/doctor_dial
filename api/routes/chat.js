/**
 * Created by Malcom on 5/9/2017.
 */

var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var ChatController = require('../controllers/'+apiVersion+ '/chat');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

router.route('/chats')
    .post(ChatController.create)
    .get(ChatController.find);


/*chat_id param*/
router.param('chat_id',ChatController.chatIdParam);
router.route('/chats/:chat_id')
    .get(ChatController.findOne)
    .put(ChatController.update)
    .delete(ChatController.delete);
module.exports = router;
