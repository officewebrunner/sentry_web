const mongoose = require('mongoose');

const sessionSchema = mongoose.Schema({
    uid: String,
    sessions : [
        {
            ip : String,
            geo : String,
            words: String,
            date: { type: Date, default: Date.now }
        }
    ]
});
sessionSchema.statics.log =  (_uid, _session) =>{
    return mongoose.model('Session').findOneAndUpdate(
        {'uid': _uid},
        { $push: { sessions: { $each: _session } } },
        {upsert: true}
    ).exec();

};
module.exports = mongoose.model('Session', sessionSchema);