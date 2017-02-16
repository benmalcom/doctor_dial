/**
 * Created by Malcom on 12/17/2016.
 */
var Q = require('q');
var Validator = require('validatorjs');
var _ = require('underscore');
var config = require('config');
var User = require('../../api/models/user');
var helper = require('../../api/utils/helper');

module.exports = {

    getVerifyUser: function (req,res) {
        var verification_hash = req.query.access_xters;
        var email = req.query.email;
        if(!verification_hash && !email)
            return res.render('custom-error',{error:"There's a problem with your verification link!"});
        User.findOne({email:email,verification_hash:verification_hash}).exec()
            .then(function (user) {
                if(!user){
                    return res.render('custom-error',{error:"Sorry we can't find any record associated with you!"});
                }
                if(user.verification_hash !=verification_hash) {
                    return res.render('custom-error',{error:"Wrong verification link!"});
                }

                user.verification_hash = "";
                user.account_verified = true;
                user.active = true;
                return user.save();
            })
            .then(function (savedUser) {
                return res.render('verify');
            },function (err) {
                return res.render('custom-error',{error:"An error occurred while trying to verify you, please try again!!"});
            });
    }
};

