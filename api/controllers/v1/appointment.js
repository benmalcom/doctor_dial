/**
 * Created by Malcom on 9/11/2016.
 */

var Appointment = require('../../models/appointment'),
    formatResponse = require('../../utils/format-response'),
    Validator = require('validatorjs'),
    _ = require('underscore'),
    helper = require('../../utils/helper'),
    config = require('config');

module.exports = {
    appointmentIdParam: function (req,res,next,appointment_id) {
        Appointment.findById(appointment_id)
            .populate('doctor')
            .populate('patient')
            .exec(function (err, appointment) {
            if (err) {
                var error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                return next(error);
            }
            else {
                req.appointment = appointment;
                console.log("req.appointment ",req.appointment);
                next();
            }
        });
    },

    create: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            user_id = req.docId,
            rules = {time:'required',date:'required',doctor:'required',patient:'required'},
            validator = new Validator(obj,rules);
        if(validator.passes())
        {
            var appointment = new Appointment(obj);
            appointment.save(function (err,savedAppointment) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry this appointment could not be created at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "A new appointment has been scheduled!";
                    res.status(meta.statusCode).json(formatResponse.do(meta,savedAppointment));
                }
            });

        }
        else
        {
            error =  helper.transformToError({code:400,message:"There are problems with your input",errors:helper.formatValidatorErrors(validator.errors.all())});
            return next(error);
        }
    },
    findOne: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            appointment = req.appointment;
        if(appointment)
        {
            meta.success = true;
            res.status(meta.statusCode).json(formatResponse.do(meta,appointment));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Appointment not found"});
            return next(error);
        }
    },

    find: function (req, res, next) {
        var query = req.query,
            error = {},
            meta = {statusCode:200, success:false},
            perPage = query.perPage ? parseInt(query.perPage,"10") : config.get('itemsPerPage.default'),
            page = query.page ? parseInt(query.page,"10") : 1,
            baseRequestUrl = config.get('app.baseUrl')+config.get('api.prefix')+"/appointments";
        meta.pagination = {perPage:perPage,page:page,currentPage:baseRequestUrl+"?page="+page};

        if(page > 1)
        {
            var prev = page - 1;
            meta.pagination.prev = prev;
            meta.pagination.nextPage = baseRequestUrl+"?page="+prev;
        }
        Appointment.count(function(err , count){
            if(!err)
            {
                meta.pagination.totalCount = count;
                if(count > (perPage * page))
                {
                    var next = ++page;
                    meta.pagination.next = next;
                    meta.pagination.nextPage = baseRequestUrl+"?page="+next;
                }
            }

        });

        Appointment.find()
            .skip(perPage * (page-1))
            .limit(perPage)
            .exec(function (err, appointments) {
                if (err)
                {
                    error =  helper.transformToError({code:503,message:"Error in server interaction",extra:err});
                    return next(error);
                }
                else {
                    meta.success = true;
                    res.status(meta.statusCode).json(formatResponse.do(meta,appointments));
                }
            });
    },


    delete: function (req, res, next) {
        var meta = {statusCode:200, success:false},
            error = {},
            appointment = req.appointment;
        if(appointment)
        {
            appointment.remove(); //TODO: Handle errors
            meta.success = true;
            meta.message = "Appointment deleted!";
            res.status(meta.statusCode).json(formatResponse.do(meta));
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Appointment not found"});
            return next(error);
        }
    },
    update: function(req, res, next){
        var meta = {statusCode:200, success:false},
            error = {},
            obj = req.body,
            appointment = req.appointment;
        if(appointment)
        {
            if(appointment.hasOwnProperty('patient'))
                delete appointment.patient;
            if(appointment.hasOwnProperty('doctor'))
                delete appointment.doctor;
            _.extend(appointment,obj);
            appointment.save(function (err,savedAppointment) {
                if(err)
                {
                    error =  helper.transformToError({code:503,message:"Sorry this appointment could not be updated at this time, try again!",extra:err});
                    return next(error);
                }
                else
                {
                    meta.success = true;
                    meta.message = "Appointment details updated!";
                    var populateOptions = [
                        {path:'doctor'},
                        {path:'patient'}
                    ];

                    Appointment.populate(savedAppointment,populateOptions,function(err, populatedAppointment){
                        return res.status(meta.statusCode).json(formatResponse.do(meta,populatedAppointment));
                    });

                }
            });
        }
        else
        {
            error =  helper.transformToError({code:404,message:"Appointment not found"});
            return next(error);
        }
    }
};
