/**
 * Created by Malcom on 9/9/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var NodeGeocoder = require('node-geocoder');
var config = require('config');
var nodemailer = require('nodemailer');
var mailgun = require('nodemailer-mailgun-transport');

var DoctorRequestSchema = new Schema({
    first_name : { type: String},
    last_name : { type: String},
    mobile : { type: String},
    email: { type : String, unique:true},
    gender : { type: String},
    dob: { type : String},
    years_of_practice: { type : String},
    current_employer: { type : String},
    mdcnr_number: {type : String},
    medical_school_attended: { type : String},
    specialties: [{ type : Schema.Types.ObjectId, ref: 'Specialty'}],
    location: {
        street: String,
        city: String,
        state: String,
        zip: String,
        coordinates: [Number]
    },
    approved : {type: Boolean, default: false}
},{
    timestamps: true
});
DoctorRequestSchema.index({'location.coordinates': '2dsphere' });

DoctorRequestSchema.pre('save', function(next){
    var data = this;
    if(!data.isModified('location') && (data.location.hasOwnProperty('coordinates') && Array.isArray(data.location.coordinates) && data.location.coordinates.length))
        return next();

    var address = data.location.street+" "+data.location.city+" "+data.location.state;
    var geocoder = NodeGeocoder(config.get('googleMapsOptions'));
    geocoder.geocode(address)
        .then(function(res) {
            console.log("res ",res);
            if(Array.isArray(res) && res[0])
            {
                data.location.coordinates = [res[0].longitude,res[0].latitude];
            }
            next();
        })
        .catch(function(err) {
            console.log("geocode error ",err);
            next();
        });
});

DoctorRequestSchema.post('save', function(doc){
    if(!doc.approved && (doc.createdAt == doc.updatedAt))
    {
        if('email' in doc && doc.email)
        {
            var message = "Hello "+doc.first_name+", your application has been received, and we are working on it! You'll hear from us soon!";
            var nodemailerMailgun = nodemailer.createTransport(mailgun(config.get('email.drivers.mailgun')));

            nodemailerMailgun.sendMail({
                from: config.get('email.from'),
                to: doc.email, // An array if you have multiple recipients.
                subject: 'DoctorDial!',
                //You can use "html:" to send HTML email content. It's magic!
                html: message
            }, function (err, info) {
                if (err) {
                    console.log('Email Error: ' + err);
                }
                else {
                    console.log('Email Response: ' + info);
                }
            });
        }
    }
});

DoctorRequestSchema.post('save', function(doc){
    if(doc.approved)
    {
        if('email' in doc && doc.email)
        {
            var message = "Hello "+doc.first_name+", your application has been approved, follow this link to start your registration!, "+
                config.get('app.baseUrl')+"/doctor-reg?email="+doc.email;
            var nodemailerMailgun = nodemailer.createTransport(mailgun(config.get('email.drivers.mailgun')));

            nodemailerMailgun.sendMail({
                from: config.get('email.from'),
                to: doc.email, // An array if you have multiple recipients.
                subject: 'DoctorDial!',
                //You can use "html:" to send HTML email content. It's magic!
                html: message
            }, function (err, info) {
                if (err) {
                    console.log('Email Error: ' + err);
                }
                else {
                    console.log('Email Response: ' + info);
                }
            });
        }
    }
});

DoctorRequestSchema.post('save', function(doc) {
    console.log('Doctor request %s has been saved', doc._id);
});

DoctorRequestSchema.post('remove', function(doc) {
    console.log('Doctor request %s has been removed', doc._id);
});

module.exports = mongoose.model('DoctorRequest', DoctorRequestSchema);