/**
 * Created by Ekaruztech on 7/18/2016.
 */
var config = require('config');
var Q = require('q');
var _ = require('underscore');
var NodeGeocoder = require('node-geocoder');
var twilioClient = require('twilio')(config.get('twilio.ACCOUNT_SID'),config.get('twilio.AUTH_TOKEN'));


var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailer = nodemailer.createTransport(sgTransport(config.get('email.drivers.sendgrid')));



exports.sendSMS = function (mobileNo,message) {
    //Send an SMS text message
    var deferred = Q.defer();
    twilioClient.sendMessage({

        to:mobileNo, // Any number Twilio can deliver to e.g +14506667788
        from: config.get('twilio.FROM'), // A number you bought from Twilio and can use for outbound communication
        body: message // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio
        if (err) { // "err" is an error received during the request, if any
            deferred.reject(err);
        }
        // "responseData" is a JavaScript object containing data received from Twilio.
        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
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
        var nums = [0,1,2,3,4,5,6,7,8,9],
            selections = "",
            numPicks = 6;

        // randomly pick one from the array
        for (var i = 0; i < numPicks; i++) {
            var index = Math.floor(Math.random() * nums.length);
            selections +=nums[index];
            nums.splice(index, 1);
        }
        return selections;
};

exports.formatValidatorErrors = function (error) {
    var errorsArray = [];
    if(!_.isEmpty(error))
    {
        for(var prop in error)
        {
            if(error.hasOwnProperty(prop))
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
    if(obj.hasOwnProperty('message') &&  obj.message)
        err.message = obj.message;
    if(obj.hasOwnProperty('code') && obj.code)
        err.code = obj.code;
    if(obj.hasOwnProperty('errors') && obj.errors)
        err.errors = obj.errors;
    if(obj.hasOwnProperty('extra') && obj.extra)
        err.extra = obj.extra;
    return err;
};

exports.formatValidatorErrors = function (error) {
    var errorsArray = [];
    if(!_.isEmpty(error))
    {
        for(var prop in error)
        {
            if(error.hasOwnProperty(prop))
            {
                _.forEach(error[prop],function (errorMessage) {
                    errorsArray.push(errorMessage);
                });
            }
        }
    }

    return errorsArray.toString();
};



