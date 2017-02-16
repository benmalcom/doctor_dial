/**
 * Created by Malcom on 9/11/2016.
 */

var DoctorRequest = require('../../models/doctor-request'),
    User = require('../../models/user'),
    formatResponse = require('../../utils/format-response'),
    Validator = require('validatorjs'),
    _ = require('underscore'),
    helper = require('../../utils/helper'),
    Q = require('q'),
    config = require('config');

module.exports = {
    doctorRequestIdParam: function (req,res,next,doctor_request_id) {
        DoctorRequest.findById(doctor_request_id)
            .populate('specialties', {name:1,_id:0})
            .exec(function (err, doctorRequest) {
            if (err) {
                var error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                return next(error);
            }
            else {
                req.doctorRequest = doctorRequest;
                next();
            }
        });
    },

    create: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            rules = {first_name : 'required', last_name : 'required', mobile : 'required', email: 'required', gender : 'required',
            dob: 'required', years_of_practice: 'required', current_employer: 'required', mdcnr_number: 'required',
            medical_school_attended: 'required', specialties: 'required', location: 'required'},
            validator = new Validator(obj,rules,{'required.specialties':'One or more specialty is required'});
        if(validator.passes())
        {
            var p1 = DoctorRequest.findOne( {$or:[ {email:obj.email}, {mobile:obj.mobile} ]}).exec(),
                p2 = p1.then(function (found) {
                if (found) {
                    console.log("found ");
                    var message = "";
                    if(found.email && found.email == obj.email)
                        message = "A doctor's request is already associated with this email";
                    else if(found.mobile && found.mobile == obj.mobile)
                        message = "A doctor's request is already associated with this mobile number";
                    error =  helper.transformToError({code:409,message:message});
                    throw error;
                }
                    return User.findOne( {$or:[ {email:obj.email}, {mobile:obj.mobile} ]}).exec()
            }),
                p3 = p2.then(function (foundUser) {
                    if (foundUser) {
                    var message = "";
                    if(foundUser.email && foundUser.email == obj.email)
                        message = "A user is already associated with this email";
                    else if(foundUser.mobile && foundUser.mobile == obj.mobile)
                        message = "A user is already associated with this mobile number";
                    error =  helper.transformToError({code:409,message:message});
                    throw error;
                }
                var doctorRequest = new DoctorRequest(obj);
                return doctorRequest.save();
            });
            Q.all([p1,p2,p3])
            .then(function (results) {
                meta.success = true;
                meta.message = "Doctor request saved!";
                return res.status(meta.statusCode).json(formatResponse.do(meta,results[2]));
            },function (err) {
                console.log("Doctor request error ",err);
                return next(err);
            });

        }
        else
        {
            error =  helper.transformToError({code:422,message:"There are problems with your input",errors:helper.formatValidatorErrors(validator.errors.all())});
            return next(error);
        }
    },
    findOne: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            doctorRequest = req.doctorRequest;
        if(doctorRequest)
        {
            meta.success = true;
            res.status(meta.statusCode).json(formatResponse.do(meta,doctorRequest));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Doctor's request not found"});
            return next(error);
        }
    },

    find: function (req, res,next) {
        var query = req.query,
            error = {},
            meta = {statusCode:200, success:false},
            perPage = query.perPage ? parseInt(query.perPage,"10") : config.get('itemsPerPage.default'),
            page = query.page ? parseInt(query.page,"10") : 1,
            baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/doctor-requests";
            meta.pagination = {perPage:perPage,page:page,currentPage:baseRequestUrl+"?page="+page};

        if(page > 1)
        {
            var prev = page - 1;
            meta.pagination.prev = prev;
            meta.pagination.nextPage = baseRequestUrl+"?page="+prev;
        }
        DoctorRequest.count(function(err , count){
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

        DoctorRequest.find()
            .skip(perPage * (page-1))
            .limit(perPage)
            .populate('specialties', {name:1,_id:0})
            .exec(function (err, doctorRequests) {
                if (err)
                {
                    error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                    return next(error);
                }
                else {
                    meta.success = true;
                    res.status(meta.statusCode).json(formatResponse.do(meta,doctorRequests));
                }
            });
    },


    delete: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            doctorRequest = req.doctorRequest;
        if(doctorRequest)
        {
            doctorRequest.remove(); //TODO: Handle errors
            meta.success = true;
            meta.message = "Doctor's request deleted!";
            res.status(meta.statusCode).json(formatResponse.do(meta));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Doctor's request not found"});
            return next(error);
        }
    },
    update: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            doctorRequest = req.doctorRequest;
        if(doctorRequest && !doctorRequest.approved)
        {
            _.extend(doctorRequest,obj);
            doctorRequest.save(function (err,updatedDoctorRequest) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry this specialty could not be updated at this time, try again",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "Doctor's request updated!";
                    res.status(meta.statusCode).json(formatResponse.do(meta,doctorRequest));
                }
            });
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Doctor's request not found"});
            return next(error);
        }
    },

    approve: function(req, res, next) {
        var meta = {statusCode: 200, success: false},
            error = {},
            obj = req.body,
            rules = {email: 'required'},
            validator = new Validator(obj, rules, {'required.email': 'Applicant\'s email is required!'});
        if (validator.passes()) {
            DoctorRequest.findOne({email: obj.email, approved: false}).exec()
                .then(function (foundRequest) {
                    if (!foundRequest) {
                        var error =  helper.transformToError({code:404,message:'No doctor\'s request associated with this email'});
                        throw next(error);
                    }
                    _.extend(foundRequest, {approved: true});
                    return foundRequest.save();
                })
                .then(function (updatedRequest) {
                    meta.success = true;
                    meta.message = "Doctor's request approved!";
                    res.status(meta.statusCode).json(formatResponse.do(meta, updatedRequest));
                },function (err) {
                    return next(err);
                });
        }
        else {
            error =  helper.transformToError({code:422,message:"There are problems with your input",errors:helper.formatValidatorErrors(validator.errors.all())});
            return next(error);
        }
    }
};
