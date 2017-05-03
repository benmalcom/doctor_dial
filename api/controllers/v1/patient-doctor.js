/**
 * Created by Malcom on 8/30/2016.
 */
var Q = require('q');
var PatientDoctor = require('../../models/patient-doctor');
var formatResponse = require('../../utils/format-response');
var Validator = require('validatorjs');
var _ = require('underscore');
var helper = require('../../utils/helper');
var config = require('config');
var ObjectId = require('valid-objectid');

module.exports = {

    patientDoctorIdParam: function (req,res,next,patient_doctor_id) {
        var error = {};
        PatientDoctor.findById(patient_doctor_id, function (err, patientDoctor) {
            if (err) {
                console.error("patient_doctor_id params error ",err);
                return next(err);
            }
            else if(patientDoctor) {
                req.patientDoctor = patientDoctor;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Not found!"}).toCustom();
                return next(error);
            }
        });
    },

    create: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var obj = req.body;
        var userId = req.userId;
        var rules = PatientDoctor.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            var patientDoctor = new PatientDoctor(obj);
            _.extend(patientDoctor,{patient: userId});
            patientDoctor.save(function (err,savedPatientDoctor) {
                if(err) {
                    error =  helper.transformToError({code:503,patientDoctor:"Sorry doctor could not be added at this time, try again!"}).toCustom();
                    return next(error);
                }
                else {
                    meta.patientDoctor = "Doctor added!";
                    res.status(meta.code).json(formatResponse.do(meta,savedPatientDoctor));
                }
            });

        }
        else {
            error =  helper.transformToError({
                code:422,
                patientDoctor:"There are some errors with your input",
                errors: helper.validationErrorsToArray(validator.errors.all())}).toCustom();
            return next(error);
        }
    },

    findOne: function (req, res, next) {
        var meta = {code:200, success:true};
        var patientDoctor = req.patientDoctor;
        res.status(meta.code).json(formatResponse.do(meta,patientDoctor));
    },

    findMyDoctors: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};
        var userId = req.userId;
        var queryCriteria = {patient:userId};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/patient-doctors";

        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};
        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            PatientDoctor.find(queryCriteria)
                .populate([
                    { path: 'doctor'}
                ])
                .skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            PatientDoctor.count(queryCriteria).exec()
        ]).spread(function(patientDoctors, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,patientDoctors));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,patientDoctor:"Error in server interaction",extra:err});
            return next(error);
        });
    },

    delete: function (req, res, next) {
        var meta = {code:200, success:true},
            error = {},
            patientDoctor = req.patientDoctor;
        patientDoctor.remove(function (err) {
            if(err){
                error =  helper.transformToError({code:503,patientDoctor:"Error in server interaction"}).toCustom();
                return next(error);
            }
            else {
                meta.patientDoctor = "Doctor removed from list!";
                res.status(meta.code).json(formatResponse.do(meta));
            }
        }); //TODO: Handle errors
    },
};
