/**
 * Created by Malcom on 5/12/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = new Schema({
    type: {type: Number},
    opened: {type: Boolean, default: false},
    url: {type: String},
    user: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
});

NotificationSchema.statics.createRules = function () {
    return {
        type: 'required',
        owner: 'required',
        url: 'required'
    }
};

NotificationSchema.statics.getTypes = function () {
    return [
        {type: 0, name: "Appointment Request"}
    ]
};



NotificationSchema.post('save', function (doc) {
    console.log('%s has been saved', doc._id);
});

module.exports = mongoose.model('Notification', NotificationSchema);
