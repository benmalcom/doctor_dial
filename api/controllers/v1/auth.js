/**
 * Created by Ekaruztech on 9/2/2016.
 */
var User = require('../../models/user');
var Patient = require('../../models/patient');
var misc = require('../../utils/misc');
var Validator = require('validatorjs');
var  _ = require('underscore');
var  Q = require('q');
var bcrypt = require('bcrypt-nodejs');
var  formatResponse = require('../../utils/format-response');
var  helper = require('../../utils/helper');

module.exports = {

    login: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            rules = {email: 'required',password:'required|min:6'},
            validator = new Validator(obj,rules);
        if(validator.passes()) {
            User.findOne({email:obj.email}, function (err, foundUser) {
                if (err) {
                    error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                    return next(error);
                }

                else if (!foundUser) {
                    error =  helper.transformToError({code:404,message:"Authentication failed. User not found"});
                    return next(error);
                }

                else {

                    if(!foundUser.account_verified) {
                        foundUser.save(); // TODO: Take care of errors here
                        meta.error = {code:meta.statusCode, message:"This account has not been verified, please verify it with the link sent to your email!"};
                        meta.token = misc.signToken({userId:foundUser._id});
                        return res.status(meta.statusCode).json(formatResponse.do(meta,foundUser));
                    }
                     else if (req.body.password != null && !foundUser.comparePassword(req.body.password)) {
                        error =  helper.transformToError({code:401,message:"Authentication failed. Wrong password supplied"});
                        return next(error);
                    }

                    else {
                        meta.token = misc.signToken({userId:foundUser._id});
                        meta.success = true;
                       return res.status(meta.statusCode).json(formatResponse.do(meta,foundUser));
                    }
                }

            });
        }
        else {
            error =  helper.transformToError({code:400,message:"There are problems with your input",errors:helper.formatValidatorErrors(validator.errors.all())});
            return next(error);
        }

    },

    startRegistration: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            rules = {email:'required',password:'required|min:6',user_type:'required'},
            validator = new Validator(obj,rules);
        if(validator.passes())
        {
            User.findOne({email:obj.email}, function (err, existingUser) {
                if (err) {
                    error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                    return next(error);
                }
                else if (existingUser) {
                    meta.statusCode = 409;
                    if(!existingUser.account_verified) {
                        obj.verification_code = helper.generateOTCode();
                        _.extend(existingUser,obj);
                        existingUser.save(); // TODO: Take care of errors here
                        message = "This Account is not verified! If you're the owner please click on the link sent to your email to verify it!";
                        meta.error = {code:meta.statusCode, message:message};
                        meta.token = misc.signToken({userId:existingUser._id});
                        res.status(meta.statusCode).json(formatResponse.do(meta,existingUser));
                    }
                    else {
                          var message = "This email is in use already!";
                          error =  helper.transformToError({code:409,message:message});
                          return next(error);
                    }

                } else {
                    obj.verification_hash = bcrypt.hashSync(Date.now(),bcrypt.genSaltSync(10));
                    var defaultUserType = obj.user_type;
                    delete obj.user_type;
                    var user = new User(obj);
                    user.user_types = [defaultUserType];
                    var p1 = user.save();
                    var patient = new Patient();
                    var p2 = patient.save();
                    Q.all([p1,p2])
                        .spread(function (user,patient) {
                            console.log("user ",user);
                            console.log("patient ",patient);
                            user.patient = patient._id;
                            patient.user = user._id;
                            return Q.all([user.save(),patient.save()])
                        })
                        .spread(function (user,patient) {
                            console.log("user ",user);
                            console.log("patient ",patient);
                            meta.success = true;
                            meta.token = misc.signToken({userId:user._id});
                            res.status(meta.statusCode).json(formatResponse.do(meta,user));
                        },function (err) {
                            console.log("error ",err);
                            error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                            return next(error);
                        });
                }
            });

        }
        else
        {
            error =  helper.transformToError({code:400,message:"There are problems with your input",errors:helper.formatValidatorErrors(validator.errors.all())});
            return next(error);
        }


    },
    changePassword: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            rules = {current_password: 'required',new_password: 'required|min:6'},
            validator = new Validator(obj,rules,{'new_password.required':'Your new password is required','new_password.min':'New password must be at least 6 characters!'});
        if(validator.passes())
        {
            var userId = req.userId;

            User.findById(userId).exec()
                .then(function (existingUser) {
                    if(!existingUser)
                    {
                        error =  helper.transformToError({code:404,message:"User not found!"});
                        throw error;
                    }
                    else if(existingUser && !existingUser.comparePassword(obj.current_password))
                    {
                        error =  helper.transformToError({code:422,message:"Operation failed, incorrect password!",});
                        throw error;
                    }
                    existingUser.password = obj.new_password;
                    return existingUser.save();
                })
                .then(function (existingUser) {
                    meta.success = true;
                    meta.message = "Password changed successfully!";
                    return res.status(meta.statusCode).json(formatResponse.do(meta,existingUser));
                },function (err) {
                    console.log("Change password error ",err);
                    return next(err);
                });
        }
        else
        {
            error =  helper.transformToError({code:400,message:"There are problems with your input",errors:helper.formatValidatorErrors(validator.errors.all())});
            return next(error);
        }

    }
};