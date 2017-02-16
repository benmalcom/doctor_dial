/**
 * Created by Ekaruztech on 7/18/2016.
 */
var _ = require('underscore');
var mongoSanitize = require('mongo-sanitize');
var htmlSanitize = require('sanitize-html');

module.exports = function(req, res, next) {

    if(req.body && !_.isEmpty(req.body))
    {
        console.info("Sanitizing req.body!");
        var body = req.body;
        for(var prop in body)
        {
            if(Object.hasOwnProperty.call(body,prop))
            {
                htmlSanitize(body[prop]);
                mongoSanitize(body[prop]);
            }
        }
    }

    if(req.query && !_.isEmpty(req.query))
    {
        console.info("Sanitizing req.query!");
        var query = req.query;
        for(var prop in query)
        {
            if(Object.hasOwnProperty.call(query,prop))
            {
                htmlSanitize(query[prop]);
                mongoSanitize(query[prop]);
            }
        }
    }

    if(req.params && !_.isEmpty(req.params))
    {
        console.info("Sanitizing req.params!");
        var params = req.params;
        for(var prop in params)
        {
            if(Object.hasOwnProperty.call(params,prop))
            {
                htmlSanitize(params[prop]);
                mongoSanitize(params[prop]);
            }
        }
    }

    return next();
};
