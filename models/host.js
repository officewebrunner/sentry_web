const mongoose = require('mongoose');
const hostSchema = mongoose.Schema({
    uid: {type: String, unique: true, index: true},
    words : {type:String,default: 'empty'},
    note: {type: String, default: 'empty'},
    external_ip: {type: String},
    geo: {type: String},
    last_call: { type: Date, default: Date.now }
});
hostSchema.statics.seek =  (_uid) => {
    return new Promise( (resolve, reject) => {
        mongoose.model('Host')
            .findOne({uid: _uid})
            .exec()
            .then( (_doc) =>{
                if (_doc) {
                    resolve(_doc);
                } else {
                    reject('Host not found.');
                }
            })
            .catch( (err) =>{

            })

    })
};
hostSchema.statics.set_words =  (_uid,_words) => {
    return mongoose.model('Host').findOneAndUpdate(
        {'uid': _uid},
        {"$set":{'words':_words}},
        {upsert: false,new: true}
    ).exec()
};
hostSchema.statics.set_note =  (_uid,_note) => {
    return mongoose.model('Host').findOneAndUpdate(
        {'uid': _uid},
        {"$set":{'note':_note}},
        {upsert: false,new: true},
    ).exec()
};
module.exports = mongoose.model('Host', hostSchema);