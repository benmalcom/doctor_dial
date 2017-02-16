/**
 * Created by Malcom on 9/15/2016.
 */

var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var TimeRangeController = require('../controllers/'+apiVersion+ '/time-range');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

router.route('/time-ranges')
    .post(TimeRangeController.create)
    .get(TimeRangeController.find);

/*time_range_id param*/
router.param('time_range_id',TimeRangeController.timeRangeIdParam);
router.route('/time-ranges/:time_range_id')
    .get(TimeRangeController.findOne)
    .put(TimeRangeController.update)
    .delete(TimeRangeController.delete);
module.exports = router;
