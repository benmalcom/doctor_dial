/**
 * Created by Malcom on 4/23/2017.
 */

var Q = require('q');
var ConsultingHour = require('../../models/consulting-hour');
var formatResponse = require('../../utils/format-response');
var Validator = require('validatorjs');
var _ = require('underscore');
var helper = require('../../utils/helper');
var config = require('config');
var ObjectId = require('valid-objectid');

module.exports = {

    consultingHourIdParam: function (req,res,next,consulting_hour_id) {
        var error = {};
        ConsultingHour.findById(consulting_hour_id, function (err, consultingHour) {
            if (err) {
                console.error("consulting_hour_id params error ",err);
                return next(err);
            }
            else if(consultingHour) {
                req.consultingHour = consultingHour;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Consulting hour not found!"}).toCustom();
                return next(error);
            }
        });
    },

    create: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var obj = req.body;
        var userId = req.userId;
        var rules = ConsultingHour.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            var consultingHour = new ConsultingHour(obj);
            consultingHour.save(function (err,savedConsultingHour) {
                if(err) {
                    error =  helper.transformToError({code:503,message:"Sorry the consulting hour could not be saved at this time, try again!"}).toCustom();
                    return next(error);
                }
                else {
                    meta.message = "Consulting hour has been setup!";
                    var opts = [
                        { path: 'time_ranges'}
                    ];
                    ConsultingHour.populate(consultingHour, opts, function (err, populated) {
                        if(err) return res.status(meta.code).json(formatResponse.do(meta, populated));
                        return res.status(meta.code).json(formatResponse.do(meta, savedConsultingHour));
                    });
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
        var consultingHour = req.consultingHour;
        var opts = [
            { path: 'time_ranges'}
        ];
        ConsultingHour.populate(consultingHour, opts, function (err, populated) {
            if(err) return res.status(meta.code).json(formatResponse.do(meta, populated));
            return res.status(meta.code).json(formatResponse.do(meta, consultingHour));
        });
    },

    find: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};
        var queryCriteria = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/consulting-hours";

        if(query.doctor_id && typeof ObjectId.isValid(query.doctor_id)){
            var dObjectId = query.doctor_id;
            queryCriteria.doctor = dObjectId;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "doctor="+dObjectId);
        }

        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};
        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            ConsultingHour.find(queryCriteria)
                .populate([
                { path: 'doctor'},
                { path: 'time_ranges'}
            ])
            .skip(per_page * (page-1)).limit(per_page).sort('sequence'),
            ConsultingHour.count(queryCriteria).exec()
        ]).spread(function(consultingHours, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,consultingHours));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },

    delete: function (req, res, next) {
        var meta = {code:200, success:true},
            error = {},
            consultingHour = req.consultingHour;
        consultingHour.remove(function (err) {
            if(err){
                error =  helper.transformToError({code:503,message:"Error in server interaction"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Consulting hour deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }
        }); //TODO: Handle errors
    },

    update: function(req, res, next){
        var meta = {code:200, success:true},
            obj = req.body,
            error = {},
            consultingHour = req.consultingHour;
        _.extend(consultingHour,obj);
        consultingHour.save(function (err,savedConsultingHour) {
            if(err) {
                error =  helper.transformToError({code:503,message:"Sorry your consulting hour not be updated at this time, try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Consulting hour updated!";
                var opts = [
                    { path: 'time_ranges'}
                ];
                ConsultingHour.populate(consultingHour, opts, function (err, populated) {
                    if(err) return res.status(meta.code).json(formatResponse.do(meta, populated));
                    return res.status(meta.code).json(formatResponse.do(meta, savedConsultingHour));
                });
            }
        });
    }
};
