/**
 * Created by Malcom on 5/8/2017.
 */
var Chat = require('../../models/chat');
var Appointment = require('../../models/appointment');
var _ = require('underscore');
var moment = require('moment');

module.exports = function (chatNsp) {
    var roomClients = [];
    var cliendIds = [];
    var roomName;

    chatNsp.on('connection', function (socket) {
        console.log("socket connected to /chat namespace!", socket.id);

        socket.on("room name",function (newRoomName) {
            roomName = newRoomName;
            cliendIds = roomName.split("_");
            socket.broadcast.emit("new room name",roomName);
        });


        socket.on("register",function (objectId) {
            var exists = _.findWhere(roomClients,{_id:objectId});
            if(exists) {
                console.log("found exists ",exists);
                var index = roomClients.indexOf(exists);
                roomClients[index].socket_id = socket.id;
            }
            else {
                var obj = {_id:objectId,socket_id:socket.id};
                roomClients.push(obj);
            }

            if(cliendIds.indexOf(objectId) > -1){
                socket.join(roomName);
            }

            socket.broadcast.emit("new register",roomClients);
        });



        socket.on("message",function (message) {
            message.time = new Date();
            console.log("New message ",message);
            chatNsp.to(roomName).emit("new message",message);
        });


    });

};