/**
 * Created by Malcom on 9/11/2016.
 */
var config = require('config');
var router = require('express').Router();
var multer = require('multer');
var apiVersion = 'v'+process.env.API_VERSION;
var SpecialtyController = require('../controllers/'+apiVersion+ '/specialty');
var checkToken = require('../../api/middlewares/auth_token');


//Middleware to check authorization token
router.use(checkToken);

router.route('/specialties')
    .post(SpecialtyController.create)
    .get(SpecialtyController.find);

/*specialty_id param*/
router.param('specialty_id',SpecialtyController.specialtyIdParam);
router.route('/specialties/:specialty_id')
    .get(SpecialtyController.findOne)
    .put(SpecialtyController.update)
    .delete(SpecialtyController.delete);
router.get('/specialties/:specialty_id/sub',SpecialtyController.getSubSpecialties);

module.exports = router;
