/**
 * Created by Malcom on 4/23/2017.
 */

var Q = require('q');
var Question = require('../../models/question');
var QuestionResponse = require('../../models/question-response');
var formatResponse = require('../../utils/format-response');
var Validator = require('validatorjs');
var _ = require('underscore');
var helper = require('../../utils/helper');
var config = require('config');
var ObjectId = require('valid-objectid');

module.exports = {

    questionIdParam: function (req,res,next,question_id) {
        var error = {};
        Question.findById(question_id, function (err, question) {
            if (err) {
                console.error("question_id params error ",err);
                return next(err);
            }
            else if(question) {
                req.question = question;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Question not found!"}).toCustom();
                return next(error);
            }
        });
    },
    create: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var obj = req.body;
        var userId = req.userId;
        var rules = Question.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            var question = new Question(obj);
            question.save(function (err,savedQuestion) {
                if(err) {
                    error =  helper.transformToError({code:503,question:"Sorry the question could not be saved at this time, try again!"}).toCustom();
                    return next(error);
                }
                else {
                    meta.question = "Your question has been posted!";
                    res.status(meta.code).json(formatResponse.do(meta,savedQuestion));
                }
            });

        }
        else {
            error =  helper.transformToError({
                code:422,
                question:"There are some errors with your input",
                errors: helper.validationErrorsToArray(validator.errors.all())}).toCustom();
            return next(error);
        }
    },
    findOne: function (req, res, next) {
        var meta = {code:200, success:true};
        var question = req.question;
        res.status(meta.code).json(formatResponse.do(meta,question));
    },
    find: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};
        var queryCriteria = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/questions";


        if(query.answered){
            var answered = (query.answered == "true");
            queryCriteria.answered = answered;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "answered="+answered);
        }
        if(query.patient_id && typeof ObjectId.isValid(query.patient_id)){
            var patient = query.patient_id;
            queryCriteria.patient = patient;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "patient_id="+patient);
        }


        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};
        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Question.find(queryCriteria)
                .populate([
                    { path: 'user'}
                ])
                .skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Question.count(queryCriteria).exec()
        ]).spread(function(questions, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,questions));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,question:"Error in server interaction",extra:err});
            return next(error);
        });
    },
    delete: function (req, res, next) {
        var meta = {code:200, success:true},
            error = {},
            question = req.question;
        question.remove(function (err) {
            if(err){
                error =  helper.transformToError({code:503,question:"Error in server interaction"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Question deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }
        }); //TODO: Handle errors
    },
    update: function(req, res, next){
        var meta = {code:200, success:true},
            obj = req.body,
            error = {},
            question = req.question;
        _.extend(question,obj);
        question.save(function (err,savedQuestion) {
            if(err) {
                error =  helper.transformToError({code:503,question:"Sorry your question not be updated at this time, try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.success = true;
                res.status(meta.code).json(formatResponse.do(meta,savedQuestion));
            }
        });
    },
    postResponse: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var obj = req.body;
        var userId = req.userId;
        var rules = QuestionResponse.createRules();
        var validator = new Validator(obj,rules);
        if(validator.passes()) {
            var questionResponse = new QuestionResponse(obj);
            _.extend(questionResponse,{user: userId,question:req.question._id});
            questionResponse.save(function (err,savedQuestionResponse) {
                if(err) {
                    error =  helper.transformToError({code:503,question:"Sorry the response could not be saved at this time, try again!"}).toCustom();
                    return next(error);
                }
                else {
                    meta.question = "Your response has been posted!";
                    res.status(meta.code).json(formatResponse.do(meta,savedQuestionResponse));
                }
            });

        }
        else {
            error =  helper.transformToError({
                code:422,
                question:"There are some errors with your input",
                errors: helper.validationErrorsToArray(validator.errors.all())}).toCustom();
            return next(error);
        }
    },
    findResponse: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};
        var queryCriteria = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/questions/"+req.question._id+"/response";

        if(query.user && typeof ObjectId.isValid(query.user)){
            var uObjectId = query.user;
            queryCriteria.user = uObjectId;
            baseRequestUrl = helper.appendQueryString(baseRequestUrl, "user="+uObjectId);
        }


        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};
        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Question.find(queryCriteria)
                .populate([
                    { path: 'user'}
                ])
                .skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Question.count(queryCriteria).exec()
        ]).spread(function(questions, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,questions));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,question:"Error in server interaction",extra:err});
            return next(error);
        });
    },

};
