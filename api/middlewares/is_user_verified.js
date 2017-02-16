/**
 * Created by Richard on 9/9/2016.
 */
var User = require('../models/user');
var responseFormat = require('../utils/format-response');

module.exports = function(req, res, next) {
    var user = req.user;
    if(user.account_verified)
    {
        console.log("User is verified!");
        var meta = {statusCode:409, success:false};
        meta.error = {code:409, message:"This account has been verified already"};
        return res.status(meta.statusCode).json(responseFormat.format(meta));
    }
    else
        next();
};