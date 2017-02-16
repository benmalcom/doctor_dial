/**
 * Created by Malcom on 8/27/2016.
 */
/**
 * Created by Ben on 5/19/2016.
 */
var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = ('v'+process.env.API_VERSION).toLowerCase();
var UserTypeController = require('../controllers/'+ apiVersion+ '/user-type');
var checkToken = require('../../api/middlewares/auth_token');
//Middleware to check authorization token
router.use(checkToken);

router.route('/user-types')
    .post(UserTypeController.saveUserType)
    .get(UserTypeController.find);

/*review_id param*/
router.param('user_type_id',UserTypeController.userTypeIdParam);
router.route('/user-types/:user_type_id')
    .get(UserTypeController.findOne)
    .put(UserTypeController.update)
    .delete(UserTypeController.delete);
module.exports = router;