/**
 * Created by Malcom on 5/13/2017.
 */

var Q = require('q');
var Notification = require('../../models/notification');
var formatResponse = require('../../utils/format-response');
var Validator = require('validatorjs');
var _ = require('underscore');
var helper = require('../../utils/helper');
var config = require('config');
var ObjectId = require('valid-objectid');

module.exports = {

    notificationIdParam: function (req,res,next,notification_id) {
        var error = {};
        Notification.findById(notification_id, function (err, notification) {
            if (err) {
                console.error("notification_id params error ",err);
                return next(err);
            }
            else if(notification) {
                req.notification = notification;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Notification not found!"}).toCustom();
                return next(error);
            }
        });
    },

    create: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var obj = req.body;
        var rules = Notification.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            var notification = new Notification(obj);
            notification.save(function (err,savedNotification) {
                if(err) {
                    error =  helper.transformToError({code:503,message:"Sorry the notification could not be saved at this time, try again!"}).toCustom();
                    return next(error);
                }
                else {
                    meta.message = "Notification has been saved!";
                    return res.status(meta.code).json(formatResponse.do(meta, savedNotification));
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
        var notification = req.notification;
        var opts = [
            {path: 'user'}
        ];
        Notification.populate(notification, opts, function (err, populated) {
            if(err) return res.status(meta.code).json(formatResponse.do(meta, populated));
            return res.status(meta.code).json(formatResponse.do(meta, notification));
        });
    },

    find: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};
        var queryCriteria = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/notifications";

        if(query.user_id && typeof ObjectId.isValid(query.user_id)){
            var user = query.user_id;
            queryCriteria.user = user;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "user_id="+user);
        }


        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};
        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Notification.find(queryCriteria)
                .populate([
                    {path: 'user'}
                ])
                .skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Notification.count(queryCriteria).exec()
        ]).spread(function(notifications, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,notifications));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },

    delete: function (req, res, next) {
        var meta = {code:200, success:true},
            error = {},
            notification = req.notification;
        notification.remove(function (err) {
            if(err){
                error =  helper.transformToError({code:503,message:"Error in server interaction"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Notification deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }
        }); //TODO: Handle errors
    },

    update: function(req, res, next){
        var meta = {code:200, success:true},
            obj = req.body,
            error = {},
            notification = req.notification;
        _.extend(notification,obj);
        notification.save(function (err,savedNotification) {
            if(err) {
                error =  helper.transformToError({code:503,message:"Sorry your notification not be updated at this time, try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Notification updated!";
                var opts = [
                    {path: 'user'}
                ];
                Notification.populate(notification, opts, function (err, populated) {
                    if(err) return res.status(meta.code).json(formatResponse.do(meta, populated));
                    return res.status(meta.code).json(formatResponse.do(meta, savedNotification));
                });
            }
        });
    }
};
