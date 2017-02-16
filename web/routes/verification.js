/**
 * Created by Malcom on 12/17/2016.
 */

var router = require('express').Router();
var VerificationController = require('../../web/controllers/verification');

router.get('/verify-me',VerificationController.getVerifyUser);

module.exports = router;