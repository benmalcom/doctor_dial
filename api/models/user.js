/**
 * Created by Emmanuel on 4/30/2016.
 */

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var config = require('config');
var helper = require('../utils/helper');


var UserSchema = new Schema({
    email : { type: String, unique : true, lowercase: true },
    password : {type:String,minlength: 6},
    first_name : { type: String},
    last_name : { type: String},
    mobile : {type: String},
    mobile2: {type: String},
    gender : {type: String},
    avatar: {type : String},
    dob: {type : String},
    location: {
        street: String,
        city: String,
        state: String,
        zip: String,
        coordinates: [Number]
    },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient'},
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor'},
    is_admin : { type: Boolean, default: false},
    active : { type: Boolean, default: false},
    verification_code: {type:String, default: ""},
    password_reset_expiration: {type:Date},
    account_verified : { type: Boolean, default: false},
    change_password: {type: Boolean, default: false},
    device_token: { type : String, default: ""}

},{
    timestamps: true
});

UserSchema.pre('save', function(next){
    var user = this;
    if(!user.isModified('password')) return next();

    bcrypt.genSalt(10, function(err, salt){
        if(err) return next(err);
        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});


UserSchema.post('save', function(doc){
    if(!doc.account_verified)
    {
        if(('email' in doc && doc.email) && ('verification_code' in doc && doc.verification_code))
        {
            var message = "<p>Hi, thank you for choosing to be part of us at DoctorDial, use this code to activate your account, </p><b>"+doc.verification_code+"</b>.";
            helper.sendMail(config.get('email.from'),doc.email,"Verify your account!",message)
                .then(function (err) {
                    console.log('Email Error: ' + err);
                },function (info) {
                    console.log('Email Response: ' + info);
                });
        }
    }
});

UserSchema.post('save', function(doc){
    if(!doc.account_verified)
    {
        if(('mobile' in doc && doc.mobile) && ('verification_code' in doc && doc.verification_code))
        {
            var message = "Please enter this code, "+doc.verification_code+" to continue";
            helper.sendSMS(doc.mobile,message)
                .then(function (successResponse) {
                    console.info("Twilio smsResponse ",successResponse);
                }, function (error) {
                    console.error("Twilio sms error ",error);
                });
        }
    }
});


UserSchema.post('save', function(doc) {
    console.log('%s has been saved', doc._id);
});

UserSchema.post('remove', function(doc) {
    console.log('%s has been removed', doc._id);
});

UserSchema.methods.comparePassword = function(password){
    return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.gravatar = function(size){
    if(!this.size) size = 200;
    if(!this.email) return 'https://gravatar.com/avatar/?s' +size+'&d=retro';
    var md5 = crypto.createHash('md5').update(this.email).digest('hex');
    return 'https://gravatar.com/avatar/' +md5+'?s=' + size +'&d=retro';
};
UserSchema.methods.toJSON = function() {
    var obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', UserSchema);