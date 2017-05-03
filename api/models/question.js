/**
 * Created by Malcom on 4/22/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QuestionSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    body: { type: String},
    answered: { type: Boolean, default: false},
    media: [{type: Schema.Types.ObjectId, ref: 'Media'}]
},{
    timestamps: true
});

QuestionSchema.statics.createRules = function() {
    return {
        body : 'required'
    }
};


QuestionSchema.post('save', function(doc) {
    console.log('Question %s has been saved', doc._id);
});

QuestionSchema.post('remove', function(doc) {
    console.log('Question %s has been removed', doc._id);
});

module.exports = mongoose.model('Question', QuestionSchema);
