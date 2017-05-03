/**
 * Created by Malcom on 3/28/2017.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MediaSchema = new Schema({
    url: {type: String, required: true},
    key: {type: String},
    mime_type: {type: String}
}, {
    timestamps: true
});

MediaSchema.statics.createRules = () => {
    return {
        url: 'required',
        key: 'required',
        mime_type: 'required'
    }
};


MediaSchema.post('save', (doc) => {
    console.log('%s has been saved', doc._id);
});

MediaSchema.post('remove', (doc) => {
    console.log('%s has been removed', doc._id);
});

module.exports = mongoose.model('Media', MediaSchema);