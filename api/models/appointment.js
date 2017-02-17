/**
 * Created by Malcom on 9/15/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AppointmentSchema = new Schema({
    title: { type: String},
    description: { type: String},
    time : { type: String},
    date : { type: Date, default: Date.now},
    patient: { type: Schema.Types.ObjectId, ref: 'User'},
    doctor: { type: Schema.Types.ObjectId, ref: 'User'},
    done : { type: Boolean, default: false}
},{
    timestamps: true
});

AppointmentSchema.statics.createRules = function() {
    return {
        time: 'required',
        date: 'required',
        doctor: 'required',
        patient: 'required'
    };
};

AppointmentSchema.post('save', function(doc) {
    console.log('Appointment %s has been saved', doc._id);
});

AppointmentSchema.post('remove', function(doc) {
    console.log('Appointment %s has been removed', doc._id);
});

module.exports = mongoose.model('Appointment', AppointmentSchema);