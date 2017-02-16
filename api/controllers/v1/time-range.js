/**
 * Created by Malcom on 9/15/2016.
 */

var TimeRange = require('../../models/time-range'),
    formatResponse = require('../../utils/format-response'),
    Validator = require('validatorjs'),
    _ = require('underscore'),
    helper = require('../../utils/helper'),
    config = require('config');

module.exports = {
    timeRangeIdParam: function (req,res,next,time_range_id) {
        TimeRange.findById(time_range_id, function (err, timeRange) {
            if (err) {
                console.log('time range error ',err);
                var error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                return next(error);
            }
            else {
                req.timeRange = timeRange;
                console.log("req.timeRange ",req.timeRange);
                next();
            }
        });
    },

    create: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            user_id = req.docId,
            rules = {value:'required'},
            validator = new Validator(obj,rules,{'required.name':'The value of the time range is not specified'});
        if(validator.passes())
        {
            var timeRange = new TimeRange(obj);
            timeRange.save(function (err,savedTimeRange) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry this time range could not be created at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "You added a new time range!";
                    res.status(meta.statusCode).json(formatResponse.do(meta,savedTimeRange));
                }
            });

        }
        else
        {
            error =  helper.transformToError({code:400,message:"There are problems with your input",errors:helper.formatValidatorErrors(validator.errors.all())});
            return next(error);
        }
    },
    findOne: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            timeRange = req.timeRange;
        if(timeRange)
        {
            meta.success = true;
            res.status(meta.statusCode).json(formatResponse.do(meta,timeRange));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Time range not found"});
            return next(error);
        }
    },

    find: function (req, res, next) {
        var query = req.query,
            error = {},
            meta = {statusCode:200, success:false},
            perPage = query.perPage ? parseInt(query.perPage,"10") : config.get('itemsPerPage.default'),
            page = query.page ? parseInt(query.page,"10") : 1,
            baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/time-ranges";
        meta.pagination = {perPage:perPage,page:page,currentPage:baseRequestUrl+"?page="+page};

        if(page > 1)
        {
            var prev = page - 1;
            meta.pagination.prev = prev;
            meta.pagination.nextPage = baseRequestUrl+"?page="+prev;
        }
        TimeRange.count(function(err , count){
            if(!err)
            {
                meta.pagination.totalCount = count;
                if(count > (perPage * page))
                {
                    var next = ++page;
                    meta.pagination.next = next;
                    meta.pagination.nextPage = baseRequestUrl+"?page="+next;
                }
            }

        });

        TimeRange.find()
            .skip(perPage * (page-1))
            .limit(perPage)
            .exec(function (err, specialties) {
                if (err)
                {
                    error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                    return next(error);
                }
                else {
                    meta.success = true;
                    res.status(meta.statusCode).json(formatResponse.do(meta,specialties));
                }
            });
    },


    delete: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            timeRange = req.timeRange;
        if(specialty)
        {
            timeRange.remove(); //TODO: Handle errors
            meta.success = true;
            meta.message = "Time range deleted!";
            res.status(meta.statusCode).json(formatResponse.do(meta));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Time range not found"});
            return next(error);
        }
    },
    update: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            timeRange = req.timeRange;
        if(timeRange)
        {
            _.extend(timeRange,obj);
            timeRange.save(function (err,savedTimeRange) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry this time range could not be updated at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "Time range updated!";
                    res.status(meta.statusCode).json(formatResponse.do(meta,timeRange));
                }
            });
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Time range not found"});
            return next(error);
        }
    }
};

