/**
 * Created by Malcom on 4/22/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QuestionResponseSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    body: { type: String},
    question: { type: Schema.Types.ObjectId, ref: 'Question'},
    media: [{type: Schema.Types.ObjectId, ref: 'Media'}]
},{
    timestamps: true
});

QuestionResponseSchema.statics.createRules = function() {
    return {
        body : 'required'
    }
};


QuestionResponseSchema.post('save', function(doc) {
    console.log('QuestionResponse %s has been saved', doc._id);
});

QuestionResponseSchema.post('remove', function(doc) {
    console.log('QuestionResponse %s has been removed', doc._id);
});

module.exports = mongoose.model('QuestionResponse', QuestionResponseSchema);
