/**
 * Created by Malcom on 9/9/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SpecialtySchema = new Schema({
    name : { type: String}
},{
    timestamps: true
});

SpecialtySchema.statics.createRules = function() {
    return {
        name : 'required'
    }
};


SpecialtySchema.post('save', function(doc) {
    console.log('Specialty %s has been saved', doc._id);
});

SpecialtySchema.post('remove', function(doc) {
    console.log('Specialty %s has been removed', doc._id);
});

module.exports = mongoose.model('Specialty', SpecialtySchema);