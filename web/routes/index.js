/**
 * Created by Malcom on 12/17/2016.
 */


module.exports = function (app) {
    app.use(require('./verification'));
    app.get("*",function (req,res, next) {
      res.status(404).send("<h1>404!</h1><h3>Page not found</h3>");
    });
};
