/**
 * Created by Malcom on 11/15/2016.
 */

var Q = require('q');
var Validator = require('validatorjs');
var _ = require('underscore');
var config = require('config');
var Doctor = require('../../models/doctor');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');

module.exports = {

    doctorIdParam: function (req,res,next,doctor_id) {
        var error = {};
        Doctor.findById(doctor_id, function (err, doctor) {
            if (err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction!"}).toCustom();
                return next(error);
            }
            else if(doctor){
                req.doctor = doctor;
                next();
            }
            else {
                error =  helper.transformToError({code:404,message:"Doctor not found!"}).toCustom();
                return next(error);
            }
        });
    },

    findOne: function (req, res, next) {
        var meta = {code:200, success:true};
        var doctor = req.doctor;
        var opts = [
            { path: 'user'},
            { path: 'specialties'}
        ];
        Doctor.populate(doctor, opts, function (err, populatedDoctor) {
            if(err) return res.status(meta.code).json(formatResponse.do(meta, doctor));
            return res.status(meta.code).json(formatResponse.do(meta, populatedDoctor));
        });

    },
    find: function (req, res, next) {
        var query = req.query;
        var meta = {code:200, success:true};
        var error = {};

        var per_page = query.per_page ? parseInt(query.per_page,"10") : config.get('itemsPerPage.default');
        var page = query.page ? parseInt(query.page,"10") : 1;
        var baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/doctors";
        meta.pagination = {per_page:per_page,page:page,current_page:helper.appendQueryString(baseRequestUrl, "page="+page)};


        if(page > 1) {
            var prev = page - 1;
            meta.pagination.previous = prev;
            meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+prev);
        }

        Q.all([
            Doctor.find().populate([
                { path: 'user'},
                { path: 'specialties'}
            ]).skip(per_page * (page-1)).limit(per_page).sort('-createdAt'),
            Doctor.count().exec()
        ]).spread(function(doctors, count) {
            meta.pagination.total_count = count;
            if(count > (per_page * page)) {
                var next = page + 1;
                meta.pagination.next = next;
                meta.pagination.next_page = helper.appendQueryString(baseRequestUrl,"page="+next);
            }
            res.status(meta.code).json(formatResponse.do(meta,doctors));
        }, function(err) {
            console.log("err ",err);
            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
            return next(error);
        });
    },
    delete: function (req, res, next) {
        var meta = {code:200, success:true};
        var error = {};
        var doctor = req.doctor;

        doctor.remove(function (err) {
            if(err) {
                console.log("error ",err);
                error =  helper.transformToError({code:503,message:"Problem deleting doctor, please try again!"}).toCustom();
                return next(error);
            }
            else {
                meta.message = "Doctor deleted!";
                res.status(meta.code).json(formatResponse.do(meta));
            }

        });
    },
    update: function(req, res, next) {
        var meta = {code: 200, success: true};
        var obj = req.body;
        var error = {};
        var doctor = req.doctor;
        _.extend(doctor, obj);
        doctor.save(function (err, savedDoctor) {
            if (err) {
                console.log("err ", err);
                error = helper.transformToError({
                    code: 503,
                    message: "Doctor details could not be updated at this time, try again!"
                }).toCustom();
                return next(error);
            }
            else {
                meta.message = "Doctor details updated!";
                res.status(meta.code).json(formatResponse.do(meta, savedDoctor));
            }
        });
    }
};