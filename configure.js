/**
 * Created by Malcom on 9/9/2016.
 */
var config = require('config');
var mongoose = require('mongoose');

module.exports = function () {

    process.env.API_VERSION = config.get('api.versions').pop();
    /*process.env.TZ = "Africa/Lagos";*/

    //Set upload directories
    global.__base = __dirname + '/';



    // Use q. Note that you **must** use `require('q').Promise`.
    mongoose.Promise = require('q').Promise;

    mongoose.connection.on("open", function() {
        console.log("Connected to mongo server.");
    });

    mongoose.connection.on("error", function(err) {
        console.log("Could not connect to mongo server!");
        console.log(err);
    });
    console.log("mongo url ",config.get('db.url'));
    mongoose.connect(config.get('db.url'));
};