/**
 * Created by Emmanuel on 4/30/2016.
 */
var config = require('config');
var router = require('express').Router();
var apiVersion = 'v'+process.env.API_VERSION;
var AuthController = require('../controllers/'+apiVersion+ '/auth');
var checkToken = require('../../api/middlewares/auth_token');


router.post('/login', AuthController.login);

//Middleware to check authorization token
router.use(checkToken);
router.post('/register',AuthController.startRegistration)
    .post('/change-password', AuthController.changePassword)
    .post('/verify-code',AuthController.verifyCode)
    //.post('/reset-password', AuthController.resetPassword)
    .post('/login', AuthController.login);

module.exports = router;