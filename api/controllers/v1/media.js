/**
 * Created by Malcom on 4/22/2017.
 */

var Q = require('q');
var Media = require('../../models/media');
var formatResponse = require('../../utils/format-response');
var Validator = require('validatorjs');
var _ = require('underscore');
var helper = require('../../utils/helper');
var config = require('config');

module.exports = {
/*

    userTypeIdParam: function (req,res,next,user_type_id) {
        var error = {};
        Media.findById(user_type_id, function (err, userType) {
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
*/

    create: function(req, res, next){
        var meta = {code:200, success:true};
        var error = {};
        var mediaToCreate = [];
        if (!req.files) {
            error = helper.transformToError({code: 503, message: "Error! File not uploaded"}).toCustom();
            return next(error);
        }
        _.each(req.files, function(file){
            var media = {};
            media.url = file.location;
            media.key = file.key;
            media.mime_type = file.mimetype;
            mediaToCreate.push(media);
        });

        Media.create(mediaToCreate)
            .then(function(savedMedia) {
                meta.message = "Media uploaded!";
                console.log("savedMedia ",savedMedia);
                res.status(meta.code).json(formatResponse.do(meta, savedMedia));
            }, function(err){
                error = helper.transformToError({
                    code: 503,
                    message: "Error saving, try again!"
                }).toCustom();
                return next(error);
            });
    },
/*

    findOne: function (req, res, next) {
        var meta = {code:200, success:true};
        var userType = req.userType;
        res.status(meta.code).json(formatResponse.do(meta,userType));
    },
*/

    find: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/media";
        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl,"page="+page)};

        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Media.find().skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Media.count().exec()
        ]).spread(function(media, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,media));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    }
    /*,

    delete: function (req, res, next) {
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

    update: function(req, res, next){
        var meta = {code:200, success:true},
            obj = req.body,
            error = {},
            userType = req.userType;
        _.extend(userType,obj);
        userType.save(function (err,savedMedia) {
            if(err) {
                error =  helper.transformToError({code:503,message:"Sorry your user type could not be updated at this time, try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.success = true;
                res.status(meta.code).json(formatResponse.do(meta,savedMedia));
            }
        });
    }*/
};
