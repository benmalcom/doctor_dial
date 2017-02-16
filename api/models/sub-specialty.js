/**
 * Created by Malcom on 9/21/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SubSpecialtySchema = new Schema({
    name : { type: String},
    specialty : {type: Schema.Types.ObjectId, ref: 'Specialty'}

},{
    timestamps: true
});

SubSpecialtySchema.post('save', function(doc) {
    console.log('Sub Specialty %s has been saved', doc._id);
});

SubSpecialtySchema.post('remove', function(doc) {
    console.log('Sub Specialty %s has been removed', doc._id);
});

module.exports = mongoose.model('SubSpecialty', SubSpecialtySchema);
