/**
 * Created by Ekaruztech on 9/2/2016.
 */
var User = require('../../models/user');
var Patient = require('../../models/patient');
var misc = require('../../utils/misc');
var Validator = require('validatorjs');
var _ = require('underscore');
var Q = require('q');
var bcrypt = require('bcrypt-nodejs');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');

module.exports = {

    login: function (req, res, next) {
        var meta = {code: 200, success: false},
            error = {},
            obj = req.body,
            rules = {username: 'required', password: 'required|min:6'},
            validator = new Validator(obj, rules, {username: "Your email or mobile number is required!"});
        if (validator.passes()) {
            User.findOne({$or: [{email: obj.username}, {mobile: obj.username}]})
                .then(function (user) {

                    if (!user) {
                        error = helper.transformToError({
                            code: 404,
                            message: "Authentication failed. User not found"
                        }).toCustom();
                        throw error;
                    }
                    else {

                        if (!user.account_verified) {
                            user.save(); // TODO: Take care of errors here
                            meta.error = {
                                code: meta.code,
                                message: "This account has not been verified, please verify it with the link sent to your email!"
                            };
                            meta.token = misc.signToken({userId: user._id});
                            return res.status(meta.code).json(formatResponse.do(meta, user));
                        }
                        else if (req.body.password != null && !user.comparePassword(req.body.password)) {
                            error = helper.transformToError({
                                code: 401,
                                message: "Authentication failed. Wrong password supplied"
                            }).toCustom();
                            return next(error);
                        }

                        else {
                            meta.token = misc.signToken({userId: user._id});
                            meta.success = true;
                            return res.status(meta.code).json(formatResponse.do(meta, user));
                        }
                    }

                });
        }
        else {
            error = helper.transformToError({
                code: 400,
                message: "There are problems with your input",
                errors: helper.validationErrorsToArray(validator.errors.all())
            }).toCustom();
            return next(error);
        }

    },

    startRegistration: function (req, res, next) {
        var meta = {code: 200, success: false},
            error = {},
            obj = req.body,
            rules = {password: 'required|min:6', user_type: 'required'},
            validator = new Validator(obj, rules);
        if (validator.passes()) {
            if (Object.hasOwnProperty.call(obj, 'mobile') || Object.hasOwnProperty.call(obj, 'email')) {
                var criteria = {'$or': []};
                if (Object.hasOwnProperty.call(obj, 'mobile')) criteria['$or'].push({mobile: obj.mobile});
                if (Object.hasOwnProperty.call(obj, 'email')) criteria['$or'].push({email: obj.email});
                User.findOne(criteria)
                    .then(function (existingUser) {
                        if (existingUser) {
                            if (existingUser.account_verified) {
                                var message = "";
                                if (Object.hasOwnProperty.call(obj, 'mobile') && existingUser.mobile && obj.mobile == existingUser.mobile)
                                    message = "This mobile number already exists";
                                if (Object.hasOwnProperty.call(obj, 'email') && existingUser.email && obj.email == existingUser.email)
                                    message = "This email address already exists";
                                error = helper.transformToError({code: 409, message: message}).toCustom();
                                throw error;
                            }
                            else {
                                obj.verification_code = helper.generateOTCode();
                                _.extend(existingUser, obj);
                                existingUser.save(); // TODO: Take care of errors here
                                message = "This Account is not verified! If you're the owner please click your email to verify it!";
                                meta.error = {code: meta.code, message: message};
                                meta.token = misc.signToken({userId: existingUser._id});
                                return res.status(meta.code).json(formatResponse.do(meta, existingUser));
                            }
                        }
                        obj.verification_code = helper.generateOTCode();
                        var defaultUserType = obj.user_type;
                        delete obj.user_type;
                        var newUser = new User(obj);
                        newUser.user_types = [defaultUserType];
                        var p1 = newUser.save();
                        var patient = new Patient();
                        var p2 = patient.save();
                        return Q.all([p1, p2]);
                    })
                    .spread(function (user, patient) {
                        user.patient = patient._id;
                        patient.user = user._id;
                        return Q.all([user.save(), patient.save()]);
                    })
                    .spread(function (user, patient) {
                        meta.success = true;
                        meta.token = misc.signToken({userId: user._id});
                        return res.status(meta.code).json(formatResponse.do(meta, user));
                    }, function (err) {
                        console.log("error ", err);
                        error = helper.transformToError({
                            code: err.custom ? err.code : 503,
                            message: err.custom ? err.message : "Error in server interaction!"
                        });
                        return next(error);
                    });
            }
            else {
                error = helper.transformToError({code: 400, message: "You must provide an email or mobile number"});
                return next(error);
            }

        }
        else {
            error = helper.transformToError({
                code: 400,
                message: "There are problems with your input",
                errors: helper.validationErrorsToArray(validator.errors.all())
            }).toCustom();
            return next(error);
        }

    },
    verifyCode: function (req, res, next) {
        var meta = {code: 200, success: false},
            error = {},
            obj = req.body,
            rules = {verification_code: 'required'},
            validator = new Validator(obj, rules);
        if (validator.passes()) {
            var userId = req.userId,
                updateObj = {verification_code: "", account_verified: true, active: true};
            User.findById(userId).exec()
                .then(function (user) {
                    if (!user) {
                        error = helper.transformToError({code: 404, message: "This user does not exist"}).toCustom();
                        throw error;
                    }
                    else if (user && user.account_verified) {
                        error = helper.transformToError({code: 409, message: "Account verified already!"}).toCustom();
                        throw error;
                    }
                    else if (user && !user.account_verified && user.verification_code != obj.verification_code) {
                        error = helper.transformToError({
                            code: 400,
                            message: "Incorrect verification code!"
                        }).toCustom();
                        throw error;
                    }
                    _.extend(user, updateObj);
                    return user.save();
                })
                .then(function (user) {
                    meta.success = true;
                    meta.message = "Code verification successful!";
                    return res.status(meta.code).json(formatResponse.do(meta, user));
                }, function (err) {
                    console.log("Code verification error ", err);
                    return next(err);
                });
        }
        else {
            error = helper.transformToError({
                code: 400,
                message: "There are problems with your input",
                errors: helper.validationErrorsToArray(validator.errors.all())
            }).toCustom();
            return next(error);
        }

    },
    changePassword: function (req, res, next) {
        var meta = {code: 200, success: false},
            error = {},
            obj = req.body,
            rules = {current_password: 'required', new_password: 'required|min:6'},
            validator = new Validator(obj, rules, {
                'new_password.required': 'Your new password is required',
                'new_password.min': 'New password must be at least 6 characters!'
            });
        if (validator.passes()) {
            var userId = req.userId;

            User.findById(userId).exec()
                .then(function (user) {
                    if (!user) {
                        error = helper.transformToError({code: 404, message: "User not found!"}).toCustom();
                        throw error;
                    }
                    else if (user && !user.comparePassword(obj.current_password)) {
                        error = helper.transformToError({
                            code: 422,
                            message: "Operation failed, incorrect password!",
                        }).toCustom();
                        throw error;
                    }
                    user.password = obj.new_password;
                    return user.save();
                })
                .then(function (user) {
                    meta.success = true;
                    meta.message = "Password changed successfully!";
                    return res.status(meta.code).json(formatResponse.do(meta, user));
                }, function (err) {
                    console.log("Change password error ", err);
                    return next(err);
                });
        }
        else {
            error = helper.transformToError({
                code: 400,
                message: "There are problems with your input",
                errors: helper.validationErrorsToArray(validator.errors.all())
            }).toCustom();
            return next(error);
        }

    }
};