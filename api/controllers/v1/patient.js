/**
 * Created by Malcom on 11/15/2016.
 */

var Q = require('q');
var Validator = require('validatorjs');
var ObjectId = require('valid-objectid');
var _ = require('underscore');
var config = require('config');
var Patient = require('../../models/patient');
var Appointment = require('../../models/appointment');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');

module.exports = {

    patientIdParam: function (req,res,next,patient_id) {
        var error = {};
        Patient.findById(patient_id, function (err, patient) {
            if (err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction!"}).toCustom();
                return next(error);
            }
            else if(patient){
                req.patient = patient;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Patient not found!"}).toCustom();
                return next(error);
            }
        });
    },

    findOne: function (req, res, next) {
        var meta = {code:200, success:true};
        var patient = req.patient;
        var opts = [
            { path: 'user'}
        ];
        Patient.populate(patient, opts, function (err, populatedPatient) {
            if(err) return res.status(meta.code).json(formatResponse.do(meta, patient));
            return res.status(meta.code).json(formatResponse.do(meta, populatedPatient));
        });
    },
    find: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/patients";
        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl, "page="+page)};


        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Patient.find().populate([
                { path: 'user'},
            ]).skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Patient.count().exec()
        ]).spread(function(patients, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,patients));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },
    delete: function (req, res, next) {
        var meta = {code:200, success:true};
        var error = {};
        var patient = req.patient;

        patient.remove(function (err) {
            if(err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Problem deleting patient, please try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Patient deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }

        });
    },
    update: function(req, res, next) {
        var meta = {code: 200, success: true};
        var obj = req.body;
        var error = {};
        var patient = req.patient;
        _.extend(patient, obj);
        patient.save(function (err, savedPatient) {
            if (err) {
                console.log("err ", err);
                error = helper.transformToError({
                    code: 503,
                    message: "Patient details could not be updated at this time, try again!"
                }).toCustom();
                return next(error);
            }
            else {
                meta.message = "Patient details updated!";
                res.status(meta.code).json(formatResponse.do(meta, savedPatient));
            }
        });
    },

    findStats: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var queryCriteria = {};
        var error = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/doctors-and-stats";
        if(!(query.patient_id && typeof ObjectId.isValid(query.patient_id))){
            error =  helper.transformToError({code:422,message:"The patient_id query is required!"});
            return next(error);
        }

        var patient = query.patient_id;
        queryCriteria.patient = patient;
        baseRequestUrl = helper.appendQueryString(baseRequestUrl, "patient="+patient);
        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl, "page="+page)};

        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Appointment.count({patient:patient,approved:true,closed:false}),
            Appointment.count({patient:patient,approved:false}),
            Appointment.count({patient:patient,approved:true,closed:false}),
            Appointment.count({patient:patient}),
        ]).spread(function(upcomingCount,pendingCount,closedCount,totalCount) {
            var stats = {
                        upcoming_appointments:upcomingCount,
                        pending_appointments:pendingCount,
                        closed_appointments: closedCount,
                        total_appointments: totalCount
            };
            res.status(meta.code).json(formatResponse.do(meta,stats));
        }, function(err) {
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    }
};