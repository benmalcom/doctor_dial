/**
 * Created by Ekaruztech on 7/18/2016.
 */

var responseFormat = require('./response');
module.exports = function(req, res, next) {
    var meta = {success:false,statusCode:404,message:'Resource not found'};
    res.status(meta.statusCode).json(responseFormat.general(meta));
};