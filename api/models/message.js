/**
 * Created by Malcom on 4/22/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    sender: {type: Schema.Types.ObjectId, ref: 'User'},
    receiver: {type: Schema.Types.ObjectId, ref: 'User'},
    body: { type: String},
    opened: { type: Boolean, default: false},
    media: [{type: Schema.Types.ObjectId, ref: 'Media'}]
},{
    timestamps: true
});

MessageSchema.statics.createRules = function() {
    return {
        receiver : 'required',
        body : 'required'
    }
};


MessageSchema.post('save', function(doc) {
    console.log('Message %s has been saved', doc._id);
});

MessageSchema.post('remove', function(doc) {
    console.log('Message %s has been removed', doc._id);
});

module.exports = mongoose.model('Message', MessageSchema);
