/**
 * Created by Ben on 9/2/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PatientSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    next_of_kin: { type: String},
    weight: { type: String},
    blood_group: { type: String},
    kids: { type: Number},
    pregnant: { type: Boolean, default: false},
    height: { type: String},
    hbs_status: { type: String},
    religion: { type: String},
    occupation: { type: String},
    known_allergies: [String],
    medical_conditions: {},
    current_medications: [String],
    gynaecological_history: { type: String}
},{
    timestamps: true
});

PatientSchema.statics.createRules = function() {
    return {
        user: 'required',
        next_of_kin: 'required',
        weight: 'required',
        blood_group: 'required',
        kids: 'required',
        pregnant: 'required',
        height: 'required',
        hbs_status: 'required',
        religion: 'required',
        occupation: 'required',
        known_allergies: 'required',
        medical_conditions: 'required',
        current_medications: 'required',
        gynaecological_history: 'required'
    };
};

PatientSchema.post('save', function(doc) {
    console.log('patient %s has been saved', doc._id);
});

PatientSchema.post('remove', function(doc) {
    console.log('patient %s has been removed', doc._id);
});

module.exports = mongoose.model('Patient', PatientSchema);