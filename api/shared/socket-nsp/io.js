/**
 * Created by Malcom on 5/8/2017.
 */
var io = require('socket.io')();
var initChatNsp = require('./chat-nsp');



//Initialize chat namespace.
var chatNsp = io.of("/chat");
initChatNsp(chatNsp);

module.exports = io;