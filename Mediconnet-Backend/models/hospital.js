const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hospitalSchema = new Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    contactNumber: { type: String, required: true },
    secreteKey: { type: String, required: true },
    isInOurSystem: { type: Boolean, default: false },
    hospitalType:{type:String,enum:[
        "General",
        "Ophthalmology",
        "Dental",
        "Cardiac",
        "Orthopedic",
        "Maternity",
        "Cancer",
        "Children",
        "Neurology",
        "Psychiatric",
        "Skin",
        "ENT", 
        "Rehabilitation"
    ]},
    licenseImage: {
        type: String,
        required: true
    },
    licenseNumber: {
        type: String,
        required: true
    }
});

const Hospital = mongoose.model('Hospital', hospitalSchema);
module.exports = Hospital;