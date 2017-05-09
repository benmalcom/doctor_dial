/**
 * Created by Malcom on 9/9/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var NodeGeocoder = require('node-geocoder');
var config = require('config');
var helper = require('../utils/helper');


var DoctorRequestSchema = new Schema({
    first_name : { type: String},
    last_name : { type: String},
    mobile : { type: String},
    email: { type : String, unique:true},
    gender : { type: String},
    dob: { type : Date},
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
DoctorRequestSchema.statics.createRules = function() {
    return {
            first_name : 'required', last_name : 'required', mobile : 'required', email: 'required', gender : 'required',
            dob: 'required', years_of_practice: 'required', current_employer: 'required', mdcnr_number: 'required',
            medical_school_attended: 'required', specialties: 'required', location: 'required'
    };
};

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
            if(Array.isArray(res) && res[0]) {
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
        if('email' in doc && doc.email) {
            var message = "Hello "+doc.first_name+", your application has been received, and we are working on it! You'll hear from us soon!";
            helper.sendMail(config.get('email.from'),doc.email,"DoctorDial - Application received!",message)
                .then(function (err) {
                    console.log('Email Error: ' + err);
                },function (info) {
                    console.log('Email Response: ' + info);
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