/**
 * Created by Malcom on 9/15/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TimeRangeSchema = new Schema({
    value : { type: String},
    disabled : { type: Boolean, default: false}
},{
    timestamps: true
});

TimeRangeSchema.statics.createRules = function() {
    return {
        value : 'required'
    }
};


TimeRangeSchema.post('save', function(doc) {
    console.log('Time Range %s has been saved', doc._id);
});

TimeRangeSchema.post('remove', function(doc) {
    console.log('Time Range %s has been removed', doc._id);
});

module.exports = mongoose.model('TimeRange', TimeRangeSchema);