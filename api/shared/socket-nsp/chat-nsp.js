/**
 * Created by Malcom on 5/8/2017.
 */
var Chat = require('../../models/chat');
var Appointment = require('../../models/appointment');
var _ = require('underscore');
var moment = require('moment');

module.exports = function (chatNsp) {
    var clients = [];

    chatNsp.on('connection', function (socket) {
        console.log("socket connected to /chat namespace!", socket.id);


        socket.on("register",function (objectId) {
            var exists = _.findWhere(clients,{_id:objectId});
            if(exists) {
                var index = clients.indexOf(exists);
                clients[index].socket_id = socket.id;
            }
            else {
                var obj = {_id:objectId,socket_id:socket.id};
                clients.push(obj);
            }

            socket.broadcast.emit("new register",clients);
        });

        socket.on("message",function (message) {
            message.time = new Date();
            console.log("New message ",message);
            socket.emit("new message",message);
            socket.broadcast.emit("new message",message);
        });

        socket.on("typing",function (name) {
            console.log("New typing ",name);
            socket.broadcast.emit("new typing",name);
        });

    });

};