/**
 * Created by Malcom on 4/22/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MyDoctorSchema = new Schema({
    patient: {type: Schema.Types.ObjectId, ref: 'User'},
    doctor: {type: Schema.Types.ObjectId, ref: 'User'}
},{
    timestamps: true
});

MyDoctorSchema.statics.createRules = function() {
    return {
        doctor : 'required'
    }
};


MyDoctorSchema.post('save', function(doc) {
    console.log('MyDoctor %s has been saved', doc._id);
});

MyDoctorSchema.post('remove', function(doc) {
    console.log('MyDoctor %s has been removed', doc._id);
});

module.exports = mongoose.model('PatientDoctor', MyDoctorSchema);