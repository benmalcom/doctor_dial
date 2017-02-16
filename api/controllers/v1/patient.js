/**
 * Created by Malcom on 9/2/2016.
 */
var Patient = require('../../models/patient'),
     Validator = require('validatorjs'),
     _ = require('underscore'),
     config = require('config'),
     fs = require('fs'),
     formatResponse = require('../../utils/format-response'),
     helper = require('../../utils/helper');

module.exports = {
    patientIdParam: function (req,res,next,patient_id) {
        Patient.findById(patient_id)
            .populate('user',{mobile:true,email:true,_id:0})
            .exec(function (err, patient) {
            if (err) {
                var error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                return next(error);
            }
            else {
                req.patient = patient;
                next();
            }
        });
    },

    findOne: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            patient = req.patient;
        if(patient)
        {
            meta.success = true;
            res.status(meta.statusCode).json(formatResponse.do(meta,patient));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Patient information not found"});
            return next(error);
        }
    },

    find: function (req, res, next) {
        var query = req.query,
            error = {},
            meta = {statusCode:200, success:false},
            perPage = query.perPage ? parseInt(query.perPage,"10") : config.get('itemsPerPage.default'),
            page = query.page ? parseInt(query.page,"10") : 1,
            baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/patients";
        meta.pagination = {perPage:perPage,page:page,currentPage:baseRequestUrl+"?page="+page};

        if(page > 1)
        {
            var prev = page - 1;
            meta.pagination.prev = prev;
            meta.pagination.nextPage = baseRequestUrl+"?page="+prev;
        }
        Patient.count(function(err , count){
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

        Patient.find()
            .populate('user',{verification_code:true,mobile:true,email:true,_id:0})
            .skip(perPage * (page-1))
            .limit(perPage)
            .exec(function (err, patients) {
                if (err)
                {
                    error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                    return next(error);
                }
                else {
                    meta.success = true;
                    res.status(meta.statusCode).json(formatResponse.do(meta,patients));
                }
            });
    },


    delete: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            patient = req.patient;
        if(patient)
        {
            patient.remove(); //TODO: Handle errors
            meta.success = true;
            meta.message = "Patient deleted!";
            res.status(meta.statusCode).json(responseFormat.format(meta));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Patient information not found"});
            return next(error);
        }
    },
    update: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            patient = req.patient;
        if(patient)
        {
            if(obj.hasOwnProperty('user'))
                delete obj.user;
            _.extend(patient,obj);
            patient.save(function (err,updatedPatient) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry your patient information could not be updated at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "Patient information updated!";
                    var populateOptions = [
                        {path:'user',select: {mobile:true,email:true,_id:0}}
                    ];

                    Patient.populate(updatedPatient,populateOptions,function(err, populatedPatient){
                        return res.status(meta.statusCode).json(formatResponse.do(meta,populatedPatient));
                    });
                }
            });
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Patient information not found"});
            return next(error);
        }

    },
    updateAvatar: function (req, res, next) {
        var userId = req.docId,
            error = {},
            patient = req.patient,
            meta = {statusCode:200, success:false};
        if (!req.file) {
            error =  helper.transformToError({code:422,message:"You didn't upload any file"});
            return next(error);
        }
        else
        {
            if(patient)
            {
                var updateObj = {avatar : req.file ? req.file.filename : ""};
                if('avatar' in patient && patient.avatar)
                {
                    var oldAvatarUrl = global.__avatar_dir+'/'+patient.avatar;
                    console.log("old avatar url ",oldAvatarUrl);
                    fs.unlink(oldAvatarUrl,function (err) {
                        if(err)
                            console.error("File unlink error ",err);
                        else
                            console.info("Previous avatar deleted");
                    });
                }
                _.extend(patient,updateObj);
                patient.save(function (err,updatedPatient) {
                    if (err) {
                        error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                        return next(error);
                    }
                    else {
                        meta.success = true;
                        meta.message = "Avatar updated!";
                        var populateOptions = [
                            {path:'user',select: {mobile:true,email:true,_id:0}}
                        ];

                        Patient.populate(updatedPatient,populateOptions,function(err, populatedPatient){
                            return res.status(meta.statusCode).json(formatResponse.do(meta,populatedPatient));
                        });
                    }
                });
            }
            else
            {
                error =  helper.transformToError({code:404,message:"Patient not found"});
                return next(error);
            }
        }
    }
};
