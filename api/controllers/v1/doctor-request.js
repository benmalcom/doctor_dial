/**
 * Created by Malcom on 11/15/2016.
 */

var Q = require('q');
var Validator = require('validatorjs');
var _ = require('underscore');
var config = require('config');
var DoctorRequest = require('../../models/doctor-request');
var User = require('../../models/user');
var Doctor = require('../../models/doctor');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');

module.exports = {

    doctorRequestIdParam: function (req,res,next,doctor_request_id) {
        var error = {};
        DoctorRequest.findById(doctor_request_id, function (err, doctorRequest) {
            if (err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction!"}).toCustom();
                return next(error);
            }
            else if(doctorRequest){
                req.doctorRequest = doctorRequest;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Request not found!"}).toCustom();
                return next(error);
            }
        });
    },
    create: function(req, res, next){
        var meta = {code:200, success:true},
            error = {};
        var obj = req.body;
        var userId = req.userId;
        var rules = DoctorRequest.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            DoctorRequest.findOne({email:obj.email}).exec()
                .then(function (foundRequest) {
                    if(foundRequest){
                        error = helper.transformToError({code: 409, message: "A request with this email exists already"}).toCustom();
                        throw error;
                    }
                    var doctorRequest = new DoctorRequest(obj);
                    return doctorRequest.save();
                })
                .then(function (savedRequest) {
                    meta.message = "Request created and an email has been sent to "+savedRequest.email;
                    res.status(meta.code).json(formatResponse.do(meta, savedRequest));
                }, function (err) {
                    console.log("error ", err);
                    error =  helper.transformToError({code: (err.custom ? err.code : 503), message: (err.custom ? err.message : "Error in server interaction!")});
                    return next(error);
                });
        }
        else {
            error =  helper.transformToError({
                code:422,
                message:"There are some errors with your input",
                messages:helper.validationErrorsToArray(validator.errors.all())}).toCustom();
            return next(error);
        }
    },


    findOne: function (req, res, next) {
        var meta = {code:200, success:true};
        var doctorRequest = req.doctorRequest;
        res.status(meta.code).json(formatResponse.do(meta,doctorRequest));
    },
    find: function (req, res, next) {
        var query = req.query,
            meta = {code:200, success:true},
            error = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/doctor-requests";
        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl, "page="+page)};


        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            DoctorRequest.find().skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            DoctorRequest.count().exec()
        ]).spread(function(doctorRequests, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,doctorRequests));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },
    delete: function (req, res, next) {
        var meta = {code:200, success:true};
        var error = {};
        var doctorRequest = req.doctorRequest;

        doctorRequest.remove(function (err) {
            if(err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Problem deleting doctor request, please try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Request deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }

        });
    },
    update: function(req, res, next) {
        var meta = {code: 200, success: true};
        var obj = req.body;
        var error = {};
        var doctorRequest = req.doctorRequest;
        _.extend(doctorRequest, obj);
        doctorRequest.save(function (err, savedDoctorRequest) {
            if (err) {
                console.log("err ", err);
                error = helper.transformToError({
                    code: 503,
                    message: "Request details could not be updated at this time, try again!"
                }).toCustom();
                return next(error);
            }
            else {
                meta.message = "Request details updated!";
                res.status(meta.code).json(formatResponse.do(meta, savedDoctorRequest));
            }
        });
    },
    approve: function(req, res, next) {
        var meta = {code: 200, success: true};
        var error = {};
        var doctorRequest = req.doctorRequest;
        var password = helper.defaultPassword();
        _.extend(doctorRequest, {approved:true});
        User.findOne({email:doctorRequest.email}).exec()
            .then(function (foundUser) {
                if(foundUser){
                    error = helper.transformToError({code: 409, message: "A user with this email exists already"}).toCustom();
                    throw error;
                }
                return doctorRequest.save();
            })
            .then(function (savedDoctorRequest) {
                var doctorObj = {};
                var userObj = {password:password};
                _.extend(userObj,_.pick(savedDoctorRequest,'first_name','last_name','email','mobile','gender','dob','location'),{active:true,account_verified:true});
                _.extend(doctorObj,_.pick(savedDoctorRequest,'years_of_practice','current_employer','mdcnr_number','medical_school_attended','specialties'));
                var user = new User(userObj);
                var doctor = new Doctor(doctorObj);
                return Q.all([user.save(),doctor.save()]);
            })
            .spread(function (user,doctor) {
                user.doctor = doctor._id;
                doctor.user = user._id;
                return Q.all([user.save(),doctor.save()]);
            })
            .spread(function (user,doctor) {
                if(('email' in user && user.email)) {
                    var message = `<p>Hello Dr. <b>`+user.first_name+`</b>, DoctorDial has approved your request and an account has been
                                     created for you with your email, and a default password of <b>`+password+`</b>, please login to change your password.</p>`;
                    helper.sendMail(config.get('email.from'),user.email,"Request confirmation!",message)
                        .then(function (err) {
                            console.log('Email Error: ' + err);
                        },function (info) {
                            console.log('Email Response: ' + info);
                        });
                }
                meta.message = "A new doctor account has been created and notified!";
                res.status(meta.code).json(formatResponse.do(meta, user));
            },function (err) {
                console.log("err ", err);
                error = helper.transformToError({
                    code: (err.custom ? err.code : 503),
                    message: (err.custom ? err.message : "Error in server interaction!")
                }).toCustom();
                return next(error);
            });

    }
};