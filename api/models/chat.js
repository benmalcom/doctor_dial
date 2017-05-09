/**
 * Created by Malcom on 5/8/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ChatSchema = new Schema({
    message: {type: String},
    sender: {type: Schema.Types.ObjectId, ref: 'User'},
    appointment: {type: Schema.Types.ObjectId, ref: 'Appointment'},
    visible: {type: Boolean, default: true}
}, {
    timestamps: true
});

ChatSchema.statics.createRules = function () {
    return {
        sender: 'required',
        message: 'required',
        appointment: 'required'
    };
};



ChatSchema.post('save', function (doc) {
    console.log('Chat %s has been saved', doc._id);
});

ChatSchema.post('remove', function (doc) {
    console.log('Chat %s has been removed', doc._id);
});

module.exports = mongoose.model('Chat', ChatSchema);
