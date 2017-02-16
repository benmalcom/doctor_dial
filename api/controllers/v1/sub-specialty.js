/**
 * Created by Malcom on 9/21/2016.
 */
/**
 * Created by Malcom on 9/11/2016.
 */

var SubSpecialty = require('../../models/sub-specialty'),
    formatResponse = require('../../utils/format-response'),
    Validator = require('validatorjs'),
    _ = require('underscore'),
    helper = require('../../utils/helper'),
    config = require('config');

module.exports = {
    subSpecialtyIdParam: function (req,res,next,sub_specialty_id) {
        SubSpecialty.findById(sub_specialty_id, function (err, subSpecialty) {
            if (err) {
                var error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                return next(error);
            }
            else {
                req.subSpecialty = subSpecialty;
                console.log("req.subSpecialty ",req.subSpecialty);
                next();
            }
        });
    },

    create: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            rules = {name:'required',specialty:'required'},
            validator = new Validator(obj,rules,{'required.name':'The sub-specialty name is not specified'});
        if(validator.passes())
        {
            var subSpecialty = new SubSpecialty(obj);
            subSpecialty.save(function (err,savedSubSpecialty) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry this sub specialty could not be created at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "You added a new sub specialty!";
                    res.status(meta.statusCode).json(formatResponse.do(meta,savedSubSpecialty));
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
            subSpecialty = req.subSpecialty;
        if(subSpecialty)
        {
            meta.success = true;
            res.status(meta.statusCode).json(formatResponse.do(meta,subSpecialty));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Sub-specialty not found"});
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
        SubSpecialty.count(function(err , count){
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

        SubSpecialty.find()
            .skip(perPage * (page-1))
            .limit(perPage)
            .exec(function (err, subSpecialties) {
                if (err)
                {
                    error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                    return next(error);
                }
                else {
                    meta.success = true;
                    res.status(meta.statusCode).json(formatResponse.do(meta,subSpecialties));
                }
            });
    },


    delete: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            subSpecialty = req.subSpecialty;
        if(subSpecialty)
        {
            subSpecialty.remove(); //TODO: Handle errors
            meta.success = true;
            meta.message = "Sub-specialty deleted!";
            res.status(meta.statusCode).json(formatResponse.do(meta));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Sub-specialty not found"});
            return next(error);
        }
    },
    update: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            subSpecialty = req.subSpecialty;
        if(subSpecialty)
        {
            _.extend(subSpecialty,obj);
            subSpecialty.save(function (err,savedSubSpecialty) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry this sub-specialty could not be updated at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "Sub-specialty updated!";
                    res.status(meta.statusCode).json(formatResponse.do(meta,savedSubSpecialty));
                }
            });
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Sub-specialty not found"});
            return next(error);
        }
    }
};

