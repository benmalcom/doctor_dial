/**
 * Created by Malcom on 5/9/2017.
 */

var Q = require('q');
var Chat = require('../../models/chat');
var formatResponse = require('../../utils/format-response');
var Validator = require('validatorjs');
var _ = require('underscore');
var helper = require('../../utils/helper');
var config = require('config');
var ObjectId = require('valid-objectid');

module.exports = {

    chatIdParam: function (req,res,next,chat_id) {
        var error = {};
        Chat.findById(chat_id, function (err, chat) {
            if (err) {
                console.error("chat_id params error ",err);
                return next(err);
            }
            else if(chat) {
                req.chat = chat;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Chat not found!"}).toCustom();
                return next(error);
            }
        });
    },

    create: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var obj = req.body;
        var rules = Chat.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            var chat = new Chat(obj);
            chat.save(function (err,savedChat) {
                if(err) {
                    error =  helper.transformToError({code:503,message:"Sorry the chat could not be saved at this time, try again!"}).toCustom();
                    return next(error);
                }
                else {
                    meta.message = "Chat has been saved!";
                    return res.status(meta.code).json(formatResponse.do(meta, savedChat));
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
        var chat = req.chat;
        var opts = [
            { path: 'time_ranges'}
        ];
        Chat.populate(chat, opts, function (err, populated) {
            if(err) return res.status(meta.code).json(formatResponse.do(meta, populated));
            return res.status(meta.code).json(formatResponse.do(meta, chat));
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
            var doctor = query.doctor_id;
            queryCriteria.doctor = doctor;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "doctor="+doctor);
        }

        if(query.patient_id && typeof ObjectId.isValid(query.patient_id)){
            var patient = query.patient_id;
            queryCriteria.patient = patient;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "patient="+patient);
        }

        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};
        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Chat.find(queryCriteria)
                .populate([
                    { path: 'doctor', populate: {path: 'user'}},
                    { path: 'patient', populate: {path: 'user'}}
                ])
                .skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Chat.count(queryCriteria).exec()
        ]).spread(function(chats, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,chats));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },

    delete: function (req, res, next) {
        var meta = {code:200, success:true},
            error = {},
            chat = req.chat;
        chat.remove(function (err) {
            if(err){
                error =  helper.transformToError({code:503,message:"Error in server interaction"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Chat deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }
        }); //TODO: Handle errors
    },

    update: function(req, res, next){
        var meta = {code:200, success:true},
            obj = req.body,
            error = {},
            chat = req.chat;
        _.extend(chat,obj);
        chat.save(function (err,savedChat) {
            if(err) {
                error =  helper.transformToError({code:503,message:"Sorry your chat not be updated at this time, try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Chat updated!";
                var opts = [
                    { path: 'doctor', populate: {path: 'user'}},
                    { path: 'patient', populate: {path: 'user'}}
                ];
                Chat.populate(chat, opts, function (err, populated) {
                    if(err) return res.status(meta.code).json(formatResponse.do(meta, populated));
                    return res.status(meta.code).json(formatResponse.do(meta, savedChat));
                });
            }
        });
    }
};
