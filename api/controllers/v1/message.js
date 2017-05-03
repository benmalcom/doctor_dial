/**
 * Created by Malcom on 8/30/2016.
 */
var Q = require('q');
var Message = require('../../models/message');
var formatResponse = require('../../utils/format-response');
var Validator = require('validatorjs');
var _ = require('underscore');
var helper = require('../../utils/helper');
var config = require('config');
var ObjectId = require('valid-objectid');

module.exports = {

    messageIdParam: function (req,res,next,message_id) {
        var error = {};
        Message.findById(message_id, function (err, message) {
            if (err) {
                console.error("message_id params error ",err);
                return next(err);
            }
            else if(message) {
                req.message = message;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Message not found!"}).toCustom();
                return next(error);
            }
        });
    },

    create: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var obj = req.body;
        var userId = req.userId;
        var rules = Message.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            var message = new Message(obj);
            _.extend(message,{sender: userId});
            message.save(function (err,savedMessage) {
                if(err) {
                    error =  helper.transformToError({code:503,message:"Sorry the message could not be saved at this time, try again!"}).toCustom();
                    return next(error);
                }
                else {
                    meta.message = "Message has been sent!";
                    res.status(meta.code).json(formatResponse.do(meta,savedMessage));
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
        var message = req.message;
        res.status(meta.code).json(formatResponse.do(meta,message));
    },

    find: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};
        var queryCriteria = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/messages";


        if(query.opened){
            var opened = (query.opened == "true");
            queryCriteria.opened = opened;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "opened="+opened);
        }
        if(query.sender_id && typeof ObjectId.isValid(query.sender_id)){
            var sObjectId = query.sender_id;
            queryCriteria.sender = sObjectId;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "sender_id="+sObjectId);
        }

        if(query.receiver_id && typeof ObjectId.isValid(query.receiver_id)){
            var rObjectId = query.receiver_id;
            queryCriteria.receiver = rObjectId;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "receiver_id="+rObjectId);
        }

        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};
        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Message.find(queryCriteria)
                .populate([
                    { path: 'sender'},
                    { path: 'receiver'}
                ])
                .skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Message.count(queryCriteria).exec()
        ]).spread(function(messages, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,messages));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },

    delete: function (req, res, next) {
        var meta = {code:200, success:true},
            error = {},
            message = req.message;
        message.remove(function (err) {
            if(err){
                error =  helper.transformToError({code:503,message:"Error in server interaction"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Message deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }
        }); //TODO: Handle errors
    },

    update: function(req, res, next){
        var meta = {code:200, success:true},
            obj = req.body,
            error = {},
            message = req.message;
        _.extend(message,obj);
        message.save(function (err,savedMessage) {
            if(err) {
                error =  helper.transformToError({code:503,message:"Sorry your message not be updated at this time, try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.success = true;
                res.status(meta.code).json(formatResponse.do(meta,savedMessage));
            }
        });
    }
};
