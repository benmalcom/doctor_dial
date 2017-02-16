/**
 * Created by Malcom on 9/7/2016.
 */

var _ = require('underscore');
var config = require('config');

module.exports = function(req, res, next) {
    console.log("checking api version......");
    var apiVersions = config.get('api.versions'),
        apiVersionHeader = req.headers['x-api-version'];
    if(apiVersionHeader && apiVersions.indexOf(apiVersionHeader))
    {
        process.env.API_VERSION = apiVersionHeader;
    }

    console.log("api version = "+process.env.API_VERSION+"......");
    next();
};
