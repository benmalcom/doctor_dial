/**
 * Created by Malcom on 9/7/2016.
 */
var User = require('../models/user');
var Patient = require('../models/patient');
var DoctorRequest = require('../models/doctor-request');
var Doctor = require('../models/doctor');


var _ = require('underscore');
var jwt = require('jsonwebtoken');
var config = require('config');
var Q = require('q');


exports.createUser = function (userObj) {
     var user = new User(userObj);
     return user.save();
};

exports.findUserByQuery = function (queryObj) {
    return User.findOne(queryObj).exec();
};

exports.findApprovedDoctorRequest = function (email) {
    return DoctorRequest.findOne({email:email,approved:true}).exec();
};
exports.createDoctor = function (doctorRequest) {
    var doctorObj = {};
    _.extend(doctorObj,_.pick(doctorRequest,'first_name','last_name','gender','dob','location'));
    _.extend(doctorObj.medical_information,_.pick(doctorRequest,'years_of_practice','current_employer','mdcnr_number','medical_school_attended','specialties'));
    var doctor = new Doctor(doctorObj);
    return doctor.save();
};

exports.createPatient = function (obj) {
    var patient = new Patient(obj);
    return patient.save();
};

exports.signToken = function (obj) {
    var token = jwt.sign(obj, config.get('authToken.superSecret'), {expiresIn: config.get('authToken.expiresIn')}); // expires in 24 hours
    return token;
};