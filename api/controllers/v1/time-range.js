/**
 * Created by Malcom on 11/15/2016.
 */

var Q = require('q');
var Validator = require('validatorjs');
var _ = require('underscore');
var config = require('config');
var TimeRange = require('../../models/time-range');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');

module.exports = {

    timeRangeIdParam: function (req,res,next,time_range_id) {
        var error = {};
        TimeRange.findById(time_range_id, function (err, timeRange) {
            if (err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction!"}).toCustom();
                return next(error);
            }
            else if(timeRange){
                req.timeRange = timeRange;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Time range not found!"}).toCustom();
                return next(error);
            }
        });
    },
    create: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var obj = req.body;
        var rules = TimeRange.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            var timeRange = new TimeRange(obj);
            timeRange.save()
                .then(function (savedTimeRange) {
                    meta.message = "Time range created!";
                    res.status(meta.code).json(formatResponse.do(meta, savedTimeRange));
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
        var timeRange = req.timeRange;
        res.status(meta.code).json(formatResponse.do(meta,timeRange));
    },
    find: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};
        meta.current_page = config.get('app.baseUrl')+config.get('api.prefix')+"/time-ranges";


        TimeRange.find()
        .then(function(timeRanges) {
            res.status(meta.code).json(formatResponse.do(meta,timeRanges));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },
    delete: function (req, res, next) {
        var meta = {code:200, success:true};
        var error = {};
        var timeRange = req.timeRange;

        timeRange.remove(function (err) {
            if(err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Problem deleting time range, please try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Time range deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }

        });
    },
    update: function(req, res, next) {
        var meta = {code: 200, success: true};
        var obj = req.body;
        var error = {};
        var timeRange = req.timeRange;
        _.extend(timeRange, obj);
        timeRange.save(function (err, savedTimeRange) {
            if (err) {
                console.log("err ", err);
                error = helper.transformToError({
                    code: 503,
                    message: "Time range details could not be updated at this time, try again!"
                }).toCustom();
                return next(error);
            }
            else {
                meta.message = "Time range details updated!";
                res.status(meta.code).json(formatResponse.do(meta, savedTimeRange));
            }
        });
    }
};