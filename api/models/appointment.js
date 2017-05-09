/**
 * Created by Malcom on 9/15/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AppointmentSchema = new Schema({
    title: {type: String},
    description: {type: String},
    time_range: {type: Schema.Types.ObjectId, ref: 'TimeRange'},
    date: {type: Date, default: Date.now},
    start_time: {type: Date, default: Date.now},
    end_time: {type: Date, default: Date.now},
    patient: {type: Schema.Types.ObjectId, ref: 'Patient'},
    doctor: {type: Schema.Types.ObjectId, ref: 'Doctor'},
    approved: {type: Boolean, default: false},
    approved_date: {type: Date},
    closed: {type: Boolean, default: false}
}, {
    timestamps: true
});

AppointmentSchema.statics.createRules = function () {
    return {
        time_range: 'required',
        date: 'required',
        doctor: 'required',
        start_time: 'required',
        end_time: 'required',
        patient: 'required'
    };
};

AppointmentSchema.pre('save', function (next) {
    var appointment = this;
    if (!appointment.isModified('approved')) return next();
    if (!appointment.approved) return next();
    appointment.approved_date = Date.now();
    next();

});

AppointmentSchema.post('save', function (doc) {
    console.log('Appointment %s has been saved', doc._id);
});

AppointmentSchema.post('remove', function (doc) {
    console.log('Appointment %s has been removed', doc._id);
});

module.exports = mongoose.model('Appointment', AppointmentSchema);