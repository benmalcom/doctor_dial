/**
 * Created by Emmanuel on 4/30/2016.
 */
var config = require('config');
var Validator = require('validatorjs');
var Q = require('q');
var _ = require('underscore');
var mongoose = require('mongoose');
var User = require('../../models/user');
var UserType = require('../../models/user-type');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');

module.exports = {
    userIdParam: function (req,res,next,user_id) {
        var error = {};
        User.findById(user_id).populate('user_types').exec()
            .then(function (user) {
                if(user) {
                    req.user = user;
                    return next();
                }
                else {
                    error =  helper.transformToError({code:404,message:"User not found"}).toCustom();
                    return next(error);
                }
            },function (err) {
                console.error("user_id params error ",err);
                error =  helper.transformToError({code:404,message:"Error in server interaction",extra:err}).toCustom();
                return next(error);
            });
    },
    find: function (req, res, next) {
        var query = req.query,
            meta = {code:200, success:true},
            error = {},
            queryCriteria = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;

        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/users";
        meta.pagination = {per_page:per_page,page:page,current_page: helper.appendQueryString(baseRequestUrl,"page="+page)};

        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            User.find().skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            User.count().exec()
        ]).spread(function(users, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,users));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },

    findOne: function (req, res, next) {
        var meta = {code:200, success:true};
        var user = req.user;
        res.status(meta.code).json(formatResponse.do(meta,user));
    },

    update: function (req, res, next) {
        var meta = {code: 200, success: true},
            error = {},
            obj = req.body,
            user = req.user;
        console.log("user ",user);
        _.extend(user,obj);
        user.save(function (err,savedUser) {
            if (err) {
                console.log("errrr",err);
                error =  helper.transformToError({code:503,message:"We encountered an error while updating your details!"}).toCustom();
                return next(error);
            }
            else {
                console.log("user ",user);
                console.log("savedUser ",savedUser);
                meta.message = "Details updated successfully!";
                res.status(meta.code).json(formatResponse.do(meta,savedUser));
            }
        });
    },
    uploadAvatar: function (req, res, next) {
        var error = {},
            meta = {code:200, success:true},
            userId = req.userId;
        if(!req.file){
            error =  helper.transformToError({code:400,message:"No file uploaded!"}).toCustom();
            return next(error);
        }
        User.findByIdAndUpdate(userId, {'$set': {avatar : req.file.location}}, {new: true})
            .then(function (savedUser) {
                if(!savedUser){
                    error =  helper.transformToError({code:404,message:"User not found!"}).toCustom();
                    throw error;
                }
                meta.message = "Avatar updated successfully!";
                res.status(meta.code).json(formatResponse.do(meta,savedUser));
            },function (err) {
                error =  helper
                    .transformToError({code: err.custom ? err.code: 503,message: err.custom ? err.message: "We encountered an error while updating your avatar!"}).toCustom();
                return next(error);
            });
    },
};
