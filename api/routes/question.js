/**
 * Created by Malcom on 4/23/2017.
 */

var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var QuestionController = require('../controllers/'+apiVersion+ '/question');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

/*question_id param*/
router.param('question_id',QuestionController.questionIdParam);
router.route('/questions/:question_id/response')
    .get(QuestionController.findResponse)
    .post(QuestionController.postResponse);
router.route('/questions/:question_id')
    .get(QuestionController.findOne)
    .put(QuestionController.update)
    .delete(QuestionController.delete);
router.route('/questions')
    .post(QuestionController.create)
    .get(QuestionController.find);

module.exports = router;