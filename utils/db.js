const mongoose = require('mongoose');
const Config = require('../config');
mongoose.Promise = global.Promise;

const connection = mongoose.connect(Config.db_uri,{ useNewUrlParser: true });

connection
    .then(db => {
        return db;
    })
    .catch(err => {
        if (err.message.code === 'ETIMEDOUT') {
            console.error('Attempting to re-establish database connection.');
            mongoose.connect(config.db_uri,{ useNewUrlParser: true });
        } else {
            console.error('Error while attempting to connect to database:');
            console.error(err);
        }
    });

module.exports = connection;
