/**
 * Created by Ekaruztech on 7/18/2016.
 */
var config = require('config');
var Q = require('q');
var _ = require('underscore');
var twilioClient = require('twilio')(config.get('twilio.ACCOUNT_SID'),config.get('twilio.AUTH_TOKEN'));
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailer = nodemailer.createTransport(sgTransport(config.get('email.drivers.sendgrid')));



exports.sendSMS = function (mobileNo,message) {
    var deferred = Q.defer();
    twilioClient.sendMessage({
        to:mobileNo, // Any number Twilio can deliver to e.g +14506667788
        from: config.get('twilio.FROM'), // A number you bought from Twilio and can use for outbound communication
        body: message // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio
        if (err) { // "err" is an error received during the request, if any
            deferred.reject(err);
        }
        deferred.resolve(responseData);
    });

    return deferred.promise;
};

exports.sendMail = function (from,to,subject,message) {
    //Send an SMS text message
    var deferred = Q.defer();
    mailer.sendMail({
        from: config.get('email.from'),
        to: to, // An array if you have multiple recipients.
        subject: subject,
        //You can use "html:" to send HTML email content. It's magic!
        html: message
    }, function (err, info) {
        if (err) {
            console.log('Email Error: ' + err);
            deferred.reject(err);
        }
        else {
            deferred.resolve(info);
            console.log('Email Response: ' + info);
        }
    });

    return deferred.promise;
};


exports.appendQueryString = function (url,queryString) {
    var returnUrl = url ? url : "";
    if (returnUrl && queryString) {
        var isQuestionMarkPresent = returnUrl && returnUrl.indexOf('?') !== -1,
            separator = isQuestionMarkPresent ? '&' : '?';
        returnUrl += separator + queryString;
    }
    return returnUrl;
};


exports.generateOTCode = function()
{
    return randomChars(6,true);
};

function randomChars(size,numbersOnly){
    var numPicks = size ? size : 6;
    var characters = numbersOnly ?  "0123456789".split("") : "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    var selections = "";
    // randomly pick one from the array
    for (var i = 0; i < numPicks; i++) {
        var index = Math.floor(Math.random() * characters.length);
        selections += characters[index];
        characters.splice(index, 1);
    }
    return selections;
}

exports.defaultPassword = function () {
    return 'P'+randomChars(5,false);
};

exports.dayFromDate = function (dateString) {
    var date = new Date(dateString);
    var weekday = new Array(7);
    weekday[0] =  "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";
    return weekday[date.getDay()];
};

exports.validationErrorsToArray = function (error) {
    var errorsArray = [];
    if(!_.isEmpty(error))
    {
        for(var prop in error)
        {
            if(Object.hasOwnProperty.call(error,prop))
            {
                _.forEach(error[prop],function (errorMessage) {
                    errorsArray.push(errorMessage);
                });
            }
        }
    }

    return errorsArray;
};
exports.transformToError = function (obj) {
    var err = new Error();
    err.toCustom = function () {
        this.custom = true;
        return this;
    };
    _.extend(err,obj);
    return err;
};
function IDGenerator(length) {

    this.length = length;
    this.timestamp = +new Date;

    var _getRandomInt = function( min, max ) {
        return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
    };

    this.generate = function() {
        var ts = this.timestamp.toString();
        var parts = ts.split( "" ).reverse();
        var id = "";

        for( var i = 0; i < this.length; ++i ) {
            var index = _getRandomInt( 0, parts.length - 1 );
            id += parts[index];
        }

        return id;
    }
}