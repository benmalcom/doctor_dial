/**
 * Created by Malcom on 11/15/2016.
 */

var Q = require('q');
var Validator = require('validatorjs');
var _ = require('underscore');
var config = require('config');
var Specialty = require('../../models/specialty');
var SubSpecialty = require('../../models/sub-specialty');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');

module.exports = {

    specialtyIdParam: function (req,res,next,specialty_id) {
        var error = {};
        Specialty.findById(specialty_id, function (err, specialty) {
            if (err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction!"}).toCustom();
                return next(error);
            }
            else if(specialty){
                req.specialty = specialty;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Specialty not found!"}).toCustom();
                return next(error);
            }
        });
    },
    create: function(req, res, next){
        var meta = {code:200, success:true},
            error = {};
        var obj = req.body;
        var rules = Specialty.createRules();
        var validator = new Validator(obj,rules,{'required.name':"The name of the specialty is required"});
        if(validator.passes()) {
            var specialty = new Specialty(obj);
            specialty.save()
                .then(function (savedSpecialty) {
                    meta.message = "Specialty created!";
                    res.status(meta.code).json(formatResponse.do(meta, savedSpecialty));
                }, function (err) {
                    console.log("error ", err);
                    error = helper.transformToError({code: 503, message: "Error in server interaction!"}).toCustom();
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
        var specialty = req.specialty;
        res.status(meta.code).json(formatResponse.do(meta,specialty));
    },
    find: function (req, res, next) {
        var query = req.query,
            meta = {code:200, success:true},
            error = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/specialties";
        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl, "page="+page)};


        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Specialty.find().skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Specialty.count().exec()
        ]).spread(function(specialties, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,specialties));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },
    delete: function (req, res, next) {
        var meta = {code:200, success:true};
        var error = {};
        var specialty = req.specialty;

        specialty.remove(function (err) {
            if(err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Problem deleting specialty, please try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Specialty deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }

        });
    },
    update: function(req, res, next) {
        var meta = {code: 200, success: true};
        var obj = req.body;
        var error = {};
        var specialty = req.specialty;
        _.extend(specialty, obj);
        specialty.save(function (err, savedSpecialty) {
            if (err) {
                console.log("err ", err);
                error = helper.transformToError({
                    code: 503,
                    message: "Specialty details could not be updated at this time, try again!"
                }).toCustom();
                return next(error);
            }
            else {
                meta.message = "Specialty details updated!";
                res.status(meta.code).json(formatResponse.do(meta, savedSpecialty));
            }
        });
    },
    createSubSpecialty: function(req, res, next){
        var meta = {code:200, success:true},
            error = {};
        var obj = req.body;
        var specialty = req.specialty;
        obj.specialty = specialty._id;
        var rules = SubSpecialty.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
                var subSpecialty = new SubSpecialty(obj);
                subSpecialty.save()
                .then(function (savedSubSpecilaty) {
                    meta.message = "Success! Sub-specialty created";
                    res.status(meta.code).json(formatResponse.do(meta, savedSubSpecilaty));
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
    findSubSpecialties: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};
        var queryCriteria = {specialty:req.specialty._id};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/specialties/"+req.specialty._id+"/sub-specialties";
        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl, "page="+page)};


        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            SubSpecialty.find(queryCriteria).skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            SubSpecialty.count(queryCriteria).exec()
        ]).spread(function(subSpecialties, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,subSpecialties));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    }
};