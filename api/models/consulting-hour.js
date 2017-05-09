/**
 * Created by Malcom on 4/23/2017.
 */
/**
 * Created by Ekaruztech on 9/2/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ConsultingHourSchema = new Schema({
    doctor: {type: Schema.Types.ObjectId, ref: 'Doctor'},
    time_ranges: [{ type : Schema.Types.ObjectId, ref: 'TimeRange'}],
    day: { type: String, enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]},
    sequence: {type: Number},
    disabled : { type: Boolean, default: false}
},{
    timestamps: true
});

ConsultingHourSchema.statics.createRules = function() {
    return {
        time_ranges : 'required',
        day : 'required',
        doctor: 'required'
    }
};

ConsultingHourSchema.pre('save', function(next){
    var doc = this;
    if(doc.day & !doc.sequence){
        var sequence = 1;
        var day = doc.day.toLowerCase();
        switch (day){
            case "monday":
                sequence = 1; break;
            case "tuesday":
                sequence = 2; break;
            case "wednesday":
                sequence = 3; break;
            case "thursday":
                sequence = 4; break;
            case "friday":
                sequence = 5; break;
            case "saturday":
                sequence = 6; break;
            case "sunday":
                sequence = 7; break;
        }

        doc.sequence = sequence;
    }
    next();
});



ConsultingHourSchema.post('save', function(doc) {
    console.log('%s has been saved', doc._id);
});

ConsultingHourSchema.post('remove', function(doc) {
    console.log('%s has been removed', doc._id);
});

module.exports = mongoose.model('ConsultingHour', ConsultingHourSchema);