/**
 * Created by Malcom on 11/15/2016.
 */

var Q = require('q');
var Validator = require('validatorjs');
var _ = require('underscore');
var config = require('config');
var SubSpecialty = require('../../models/sub-specialty');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');

module.exports = {

    subSpecialtyIdParam: function (req,res,next,sub_specialty_id) {
        var error = {};
        SubSpecialty.findById(sub_specialty_id, function (err, subSpecialty) {
            if (err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction!"}).toCustom();
                return next(error);
            }
            else if(subSpecialty){
                req.subSpecialty = subSpecialty;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Sub specialty not found!"}).toCustom();
                return next(error);
            }
        });
    },
    create: function(req, res, next){
        var meta = {code:200, success:true},
            error = {};
        var obj = req.body;
        var rules = SubSpecialty.createRules();
        var validator = new Validator(obj,rules,{'required.name':"The name of the sub-specialty is required"});
        if(validator.passes()) {
            var subSpecialty = new SubSpecialty(obj);
            subSpecialty.save()
                .then(function (savedSubSpecialty) {
                    meta.message = "Sub specialty created!";
                    res.status(meta.code).json(formatResponse.do(meta, savedSubSpecialty));
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
        var subSpecialty = req.subSpecialty;
        res.status(meta.code).json(formatResponse.do(meta,subSpecialty));
    },
    find: function (req, res, next) {
        var query = req.query,
            meta = {code:200, success:true},
            error = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/sub-specialties";
        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl, "page="+page)};


        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            SubSpecialty.find().skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            SubSpecialty.count().exec()
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
    },
    delete: function (req, res, next) {
        var meta = {code:200, success:true};
        var error = {};
        var subSpecialty = req.subSpecialty;

        subSpecialty.remove(function (err) {
            if(err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Problem deleting sub-specialty, please try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Sub-specialty deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }

        });
    },
    update: function(req, res, next) {
        var meta = {code: 200, success: true};
        var obj = req.body;
        var error = {};
        var subSpecialty = req.subSpecialty;
        _.extend(subSpecialty, obj);
        subSpecialty.save(function (err, savedSubSpecialty) {
            if (err) {
                console.log("err ", err);
                error = helper.transformToError({
                    code: 503,
                    message: "Sub-specialty details could not be updated at this time, try again!"
                }).toCustom();
                return next(error);
            }
            else {
                meta.message = "Sub-specialty details updated!";
                res.status(meta.code).json(formatResponse.do(meta, savedSubSpecialty));
            }
        });
    }
};