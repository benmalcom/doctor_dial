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
    app.use(prefix,require('./media'));
    app.use(prefix,require('./message'));
    app.use(prefix,require('./question'));
    app.use(prefix,require('./patient-doctor'));
    app.use(prefix,require('./consulting-hour'));
    app.use(prefix,require('./chat'));


    app.use(config.get('api.prefix')+"/*",function (req,res) {
        var meta = {success:false,code:404};
        meta.error = {code:meta.code,message:"Resource not found"};
        res.status(meta.code).json(formatResponse.do(meta));
    });
};