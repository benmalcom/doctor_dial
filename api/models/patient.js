/**
 * Created by Ben on 9/2/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var NodeGeocoder = require('node-geocoder');
var config = require('config');

var PatientSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    next_of_kin: { type: String},
    weight: { type: String},
    blood_group: { type: String},
    kids: { type: Number},
    pregnant: { type: Boolean, defaultsTo: false},
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

PatientSchema.post('save', function(doc) {
    console.log('patient %s has been saved', doc._id);
});

PatientSchema.post('remove', function(doc) {
    console.log('patient %s has been removed', doc._id);
});

module.exports = mongoose.model('Patient', PatientSchema);