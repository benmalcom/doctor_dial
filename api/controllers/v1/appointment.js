/**
 * Created by Malcom on 8/30/2016.
 */
var Q = require('q');
var Appointment = require('../../models/appointment');
var formatResponse = require('../../utils/format-response');
var Validator = require('validatorjs');
var _ = require('underscore');
var helper = require('../../utils/helper');
var config = require('config');
var ObjectId = require('valid-objectid');

module.exports = {

    appointmentIdParam: function (req,res,next,appointment_id) {
        var error = {};
        Appointment.findById(appointment_id, function (err, appointment) {
            if (err) {
                console.error("appointment_id params error ",err);
                return next(err);
            }
            else if(appointment) {
                req.appointment = appointment;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Appointment not found!"}).toCustom();
                return next(error);
            }
        });
    },

    create: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var obj = req.body;
        var rules = Appointment.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            var appointment = new Appointment(obj);
            appointment.save(function (err,savedAppointment) {
                if(err) {
                    error =  helper.transformToError({code:503,message:"Sorry the appointment could not be saved at this time, try again!"}).toCustom();
                    return next(error);
                }
                else {
                    meta.message = "Appointment has been setup!";
                    res.status(meta.code).json(formatResponse.do(meta,savedAppointment));
                }
            });

        }
        else {
            error =  helper.transformToError({
                code:422,
                message:"There are some errors with your input",
                errors: helper.validationErrorsToArray(validator.errors.all())}).toCustom();
            return next(error);
        }
    },

    findOne: function (req, res, next) {
        var meta = {code:200, success:true};
        var appointment = req.appointment;
        res.status(meta.code).json(formatResponse.do(meta,appointment));
    },

    find: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};
        var queryCriteria = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/appointments";
        if(query.doctor && typeof ObjectId.isValid(query.doctor)){
            var dObjectId = query.doctor;
            queryCriteria.doctor = dObjectId;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "doctor="+dObjectId);
        }

        if(query.patient && typeof ObjectId.isValid(query.patient)) {
            var pObjectId = query.patient;
            queryCriteria.patient = pObjectId;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "patient=" + pObjectId);
        }

        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};
        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Appointment.find(queryCriteria).skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Appointment.count(queryCriteria).exec()
        ]).spread(function(appointments, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,appointments));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },

    delete: function (req, res, next) {
        var meta = {code:200, success:true},
            error = {},
            appointment = req.appointment;
        appointment.remove(function (err) {
            if(err){
                error =  helper.transformToError({code:503,message:"Error in server interaction"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Appointment deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }
        }); //TODO: Handle errors
    },

    update: function(req, res, next){
        var meta = {code:200, success:true},
            obj = req.body,
            error = {},
            appointment = req.appointment;
        _.extend(appointment,obj);
        appointment.save(function (err,savedAppointment) {
            if(err) {
                error =  helper.transformToError({code:503,message:"Sorry your appointment not be updated at this time, try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.success = true;
                res.status(meta.code).json(formatResponse.do(meta,savedAppointment));
            }
        });
    }
};
