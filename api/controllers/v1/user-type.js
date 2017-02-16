/**
 * Created by Malcom on 8/30/2016.
 */
var Q = require('q');
var UserType = require('../../models/user-type');
var formatResponse = require('../../utils/format-response');
var Validator = require('validatorjs');
var _ = require('underscore');
var helper = require('../../utils/helper');
var config = require('config');

module.exports = {

    userTypeIdParam: function (req,res,next,user_type_id) {
        var error = {};
        UserType.findById(user_type_id, function (err, userType) {
            if (err) {
                console.error("user_type_id params error ",err);
                return next(err);
            }
            else if(userType) {
                req.userType = userType;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"User type not found!"}).toCustom();
                return next(error);
            }
        });
    },

    saveUserType: function(req, res){
        var meta = {code:200, success:true},
            error = {};
            var obj = req.body;
            var rules = {name:'required'};
            var validator = new Validator(obj,rules,{'required.name':"The name of the user type is required"});
            if(validator.passes()) {
                var userType = new UserType(obj);
                userType.save(function (err,savedUserType) {
                    if(err) {
                        error =  helper.transformToError({code:503,message:"Sorry the user type type could not be saved at this time, try again!"}).toCustom();
                        return next(error);
                    }
                    else {
                        meta.message = "New user type created!";
                        res.status(meta.code).json(formatResponse.do(meta,savedUserType));
                    }
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

    findOne: function (req, res) {
        var meta = {code:200, success:true};
            res.status(meta.code).json(formatResponse.do(meta,userType));
    },

    find: function (req, res) {
        var query = req.query,
            meta = {code:200, success:true},
            error = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/user-types";
        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};

        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            UserType.find().skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            UserType.count().exec()
        ]).spread(function(userTypes, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,userTypes));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },

    delete: function (req, res) {
        var meta = {code:200, success:true},
            error = {},
            userType = req.userType;
            userType.remove(function (err) {
                if(err){
                    error =  helper.transformToError({code:503,message:"Error in server interaction"}).toCustom();
                    return next(error);
                }
                else {
                    meta.message = "User type deleted!";
                    res.status(meta.code).json(formatResponse.do(meta));
                }
            }); //TODO: Handle errors
    },

    update: function(req, res){
        var meta = {code:200, success:true},
            obj = req.body,
            error = {},
            userType = req.userType;
            _.extend(userType,obj);
            userType.save(function (err,savedUserType) {
                if(err) {
                    error =  helper.transformToError({code:503,message:"Sorry your user type could not be updated at this time, try again!"}).toCustom();
                    return next(error);
                }
                else {
                    meta.success = true;
                    res.status(meta.code).json(formatResponse.do(meta,savedUserType));
                }
            });
    }
};
