/**
 * Created by Ekaruztech on 9/2/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var NodeGeocoder = require('node-geocoder');
var config = require('config');

var DoctorSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    consulting_hours: [{ type : Schema.Types.ObjectId, ref: 'TimeRange'}],
    years_of_practice: { type : String},
    current_employer: { type : String},
    mdcnr_number: {type : String},
    medical_school_attended: { type : String},
    specialties: [{ type : Schema.Types.ObjectId, ref: 'Specialty'}],
    sub_specialties: { type : String}
},{
    timestamps: true
});

DoctorSchema.post('save', function(doc) {
    console.log('%s has been saved', doc._id);
});

DoctorSchema.post('remove', function(doc) {
    console.log('%s has been removed', doc._id);
});

module.exports = mongoose.model('Doctor', DoctorSchema);