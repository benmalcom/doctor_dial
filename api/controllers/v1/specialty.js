/**
 * Created by Malcom on 9/11/2016.
 */

var Specialty = require('../../models/specialty'),
    SubSpecialty = require('../../models/sub-specialty'),
    formatResponse = require('../../utils/format-response'),
    Validator = require('validatorjs'),
    _ = require('underscore'),
    helper = require('../../utils/helper'),
    config = require('config');

module.exports = {
    specialtyIdParam: function (req,res,next,specialty_id) {
        Specialty.findById(specialty_id, function (err, specialty) {
            if (err) {
                var error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                return next(error);
            }
            else {
                req.specialty = specialty;
                console.log("req.specialty ",req.specialty);
                next();
            }
        });
    },

    create: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            user_id = req.docId,
            rules = {name:'required'},
            validator = new Validator(obj,rules,{'required.name':'The specialty name is not specified'});
        if(validator.passes())
        {
            var specialty = new Specialty(obj);
            specialty.save(function (err,savedSpecialty) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry this specialty could not be created at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "You added a new specialty!";
                    res.status(meta.statusCode).json(formatResponse.do(meta,savedSpecialty));
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
            specialty = req.specialty;
        if(specialty)
        {
            meta.success = true;
            res.status(meta.statusCode).json(formatResponse.do(meta,specialty));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Specialty not found"});
            return next(error);
        }
    },

    find: function (req, res, next) {
        var query = req.query,
            error = {},
            meta = {statusCode:200, success:false},
            perPage = query.perPage ? parseInt(query.perPage,"10") : config.get('itemsPerPage.default'),
            page = query.page ? parseInt(query.page,"10") : 1,
            baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/specialties";
            meta.pagination = {perPage:perPage,page:page,currentPage:baseRequestUrl+"?page="+page};

        if(page > 1)
        {
            var prev = page - 1;
            meta.pagination.prev = prev;
            meta.pagination.nextPage = baseRequestUrl+"?page="+prev;
        }
        Specialty.count(function(err , count){
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

        Specialty.find()
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
            specialty = req.specialty;
        if(specialty)
        {
            specialty.remove(); //TODO: Handle errors
            meta.success = true;
            meta.message = "Specialty deleted!";
            res.status(meta.statusCode).json(formatResponse.do(meta));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Specialty not found"});
            return next(error);
        }
    },
    update: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            specialty = req.specialty;
            if(specialty)
            {
                _.extend(specialty,obj);
                specialty.save(function (err,savedSpecialty) {
                    if(err)
                    {
                        error =  helper.transformToError({code:503,message:"Sorry this specialty could not be updated at this time, try again!",extra:err});
                        return next(error);
                    }
                    else
                    {
                        meta.success = true;
                        meta.message = "Specialty updated!";
                        res.status(meta.statusCode).json(formatResponse.do(meta,specialty));
                    }
                });
            }
            else
            {
                error =  helper.transformToError({code:404,message:"Specialty not found"});
                return next(error);
            }
    }
    ,
    getSubSpecialties: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            specialty = req.specialty;
        if(specialty)
        {
            SubSpecialty.find({specialty:specialty._id},function (err,subSpecialties) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry this sub-specialty could not be retrieved at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    res.status(meta.statusCode).json(formatResponse.do(meta,subSpecialties));
                }
            });
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Specialty not found"});
            return next(error);
        }
    }
};
