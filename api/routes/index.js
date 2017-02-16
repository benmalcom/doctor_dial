/**
 * Created by Ekaruztech on 7/19/2016.
 */
var config = require('config');
var prefix = config.get('api.prefix');
var formatResponse = require('../utils/format-response');

module.exports = function (app) {
    app.use(prefix,require('./auth'));
    app.use(prefix,require('./doctor'));
    app.use(prefix,require('./patient'));
    app.use(prefix,require('./specialty'));
    app.use(prefix,require('./sub-specialty'));
    app.use(prefix,require('./doctor-request'));
    app.use(prefix,require('./time-range'));
    app.use(prefix,require('./appointment'));
    app.use(prefix,require('./user'));
    app.use(prefix,require('./user-type'));

    app.use(config.get('api.prefix')+"/*",function (req,res) {
        var meta = {success:false,statusCode:404};
        meta.error = {code:meta.statusCode,message:"Resource not found"};
        res.status(meta.statusCode).json(formatResponse.do(meta));
    });
};