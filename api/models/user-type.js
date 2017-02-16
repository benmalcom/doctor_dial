/**
 * Created by Malcom on 8/30/2016.
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserTypeSchema = new Schema({
    name: {type:String, required: true}
},{
    timestamps: true
});

UserTypeSchema.post('save', function(doc) {
    console.log('%s has been saved', doc._id);
});

UserTypeSchema.post('remove', function(doc) {
    console.log('%s has been removed', doc._id);
});
module.exports = mongoose.model('UserType', UserTypeSchema);
