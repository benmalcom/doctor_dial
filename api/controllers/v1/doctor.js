/**
 * Created by Malcom on 9/2/2016.
 */
var User = require('../../models/user'),
    Doctor = require('../../models/doctor'),
    Validator = require('validatorjs'),
    _ = require('underscore'),
    config = require('config'),
    fs = require('fs'),
    Q = require('q'),
    formatResponse = require('../../utils/format-response'),
    helper = require('../../utils/helper'),
    misc = require('../../utils/misc');

module.exports = {
    doctorIdParam: function (req,res,next,doctor_id) {
        Doctor.findById(doctor_id)
            .populate('user',{verification_code:true,mobile:true,email:true,_id:0})
            .populate('specialties',{name:true,_id:0})
            .exec(function (err, doctor) {
                if (err) {
                    var error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                    return next(error);
                }
                else {
                    req.doctor = doctor;
                    next();
                }
            });
    },
    create: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            rules = {email:'required|email',password:'required'},
            validator = new Validator(obj,rules,{'required.email':"The doctor's email is required"});
        if(validator.passes())
        {
            var p1 = misc.findApprovedDoctorRequest(obj.email),
                p2 = p1.then(function (foundRequest) {
                    if (!foundRequest) {
                        error =  helper.transformToError({code:404,message:'No doctor\'s request associated with this email'});
                        throw error;
                    }

                    return [foundRequest,misc.findUserByQuery({$or:[ {email:foundRequest.email}, {mobile:foundRequest.mobile} ]})];
                }),
                p3 = p2.spread(function (foundRequest,existingUser) {

                    if (existingUser) {
                        var message = "";
                        if(existingUser.email && existingUser.email==foundRequest.email)
                            message = "Your request email is in use by another person!";
                        else if(existingUser.mobile && existingUser.mobile==foundRequest.mobile)
                            message = "Your request mobile number is in use by another person!";
                        else
                            message = "User with your credentials exists already!";
                        error =  helper.transformToError({code:409,message:message});
                        throw error;
                    }
                    return [misc.createUser(_.extend({password:obj.password,active:true,account_verified:true,verification_code:""},_.pick(foundRequest,'mobile','email'))),misc.createDoctor(foundRequest)];
                }),
                p4 = p3.spread(function (newUser,newDoctor) {
                    newUser.doctor = newDoctor._id;
                    newDoctor.user = newUser._id;
                    return Q.all([newUser.save(),newDoctor.save()]);
                });
            Q.all([p1,p2,p3,p4])
                .then(function (results) {
                    console.log("results ",results);
                    meta.success = true;
                    meta.message = "Account created successfully!";
                    var user = results[2][0],
                        populateOptions = {path:'doctor',select: {createdAt:false,updatedAt:false,user:false,_id:0}};

                    User.populate(user,populateOptions,function(err, populatedUser){
                        return res.status(meta.statusCode).json(formatResponse.do(meta,populatedUser));
                    });
                },function (err) {
                    console.log("error ",err);
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
            doctor = req.doctor;
        if(doctor)
        {
            meta.success = true;
            res.status(meta.statusCode).json(formatResponse.do(meta,doctor));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Doctor information not found"});
            return next(error);
        }
    },

    find: function (req, res, next) {
        var query = req.query,
            error = {},
            meta = {statusCode:200, success:false},
            perPage = query.perPage ? parseInt(query.perPage,"10") : config.get('itemsPerPage.default'),
            page = query.page ? parseInt(query.page,"10") : 1,
            baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/doctors";
        meta.pagination = {perPage:perPage,page:page,currentPage:baseRequestUrl+"?page="+page};

        if(page > 1)
        {
            var prev = page - 1;
            meta.pagination.prev = prev;
            meta.pagination.nextPage = baseRequestUrl+"?page="+prev;
        }
        Doctor.count(function(err , count){
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

        Doctor.find()
            .populate('user',{verification_code:true,mobile:true,email:true,_id:0})
            .populate('specialties',{name:true,_id:0})
            .skip(perPage * (page-1))
            .limit(perPage)
            .exec(function (err, doctors) {
                if (err)
                {
                    error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                    return next(error);
                }
                else {
                    meta.success = true;
                    res.status(meta.statusCode).json(formatResponse.do(meta,doctors));
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
            meta.message = "Doctor deleted!";
            res.status(meta.statusCode).json(formatResponse.do(meta));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Doctor information not found"});
            return next(error);
        }
    },
    update: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            doctor = req.doctor;
        if(doctor)
        {
            if(obj.hasOwnProperty('user'))
                delete obj.user;
            _.extend(doctor,obj);
            doctor.save(function (err,updatedDoctor) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry your information could not be updated at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "Doctor information updated!";
                    var populateOptions = [
                            {path:'user',select: {mobile:true,email:true,_id:0}},
                            {path:'medical_information.specialties',select: {name:true,_id:0}}
                        ];

                    Doctor.populate(updatedDoctor,populateOptions,function(err, populatedDoctor){
                        return res.status(meta.statusCode).json(formatResponse.do(meta,populatedDoctor));
                    });

                }
            });
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Doctor information not found"});
            return next(error);
        }

    },
    updateAvatar: function (req, res, next) {
        var userId = req.docId,
            error = {},
            doctor = req.doctor,
            meta = {statusCode:200, success:false};
        if (!req.file) {
            error =  helper.transformToError({code:422,message:"You didn't upload any file"});
            return next(error);
        }
        else
        {
            if(doctor)
            {
                var updateObj = {avatar : req.file ? req.file.filename : ""};
                if('avatar' in doctor && doctor.avatar)
                {
                    var oldAvatarUrl = global.__avatar_dir+'/'+doctor.avatar;
                    fs.unlink(oldAvatarUrl,function (err) {
                        if(err)
                            console.error("File unlink error ",err);
                        else
                            console.info("Previous avatar deleted");
                    });
                }
                _.extend(doctor,updateObj);
                doctor.save(function (err,updatedDoctor) {
                    if (err) {
                        error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                        return next(error);
                    }
                    else {
                        meta.success = true;
                        meta.message = "Avatar updated!";
                        var populateOptions = [
                            {path:'user',select: {mobile:true,email:true,_id:0}},
                            {path:'medical_information.specialties',select: {name:true,_id:0}}
                        ];

                        Doctor.populate(updatedDoctor,populateOptions,function(err, populatedDoctor){
                            return res.status(meta.statusCode).json(formatResponse.do(meta,populatedDoctor));
                        });
                    }
                });
            }
            else
            {
                error =  helper.transformToError({code:404,message:"Doctor information not found"});
                return next(error);
            }
        }
    }
};
