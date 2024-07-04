const fs = require('fs');
const crypto = require('crypto');
const util = require('util');
const msgpack = require('msgpack-lite');
const geoip = require('geoip-lite');
const pako = require('pako');
const Redis = require("ioredis");
const redis = new Redis();
const Config = require('../config');
const Host = require('../models/host');
const Session = require('../models/session');
exports.init = (req, res, next) => {
    let data = [];
    req
        .on('data', (chunk) => {
            data.push(chunk);
        })
        .on('end', async () => {
            const body = Buffer.concat(data);
            if (body.length < 1) {
                return next(404);
            }
            let meta_buf;
            try {
                meta_buf = pako.inflate(body);
            }catch(e){
                return next(404);
            }
            let meta_array;
            let geo = geoip.lookup(req.ip);
            try{
                meta_array = msgpack.decode(meta_buf);
            }catch (e) {
                return next(404);
            }
            if (meta_array.length !== 3) {
                return next(404);
            }
            if(!meta_array[2].toLowerCase().includes("sentry")){
                return next(404);
            }
            let is_new_host = false;
            let host_doc = null;
            try {
                host_doc = await Host.seek(`${meta_array[0]}_${meta_array[1]}`);
            } catch (e) {
                is_new_host = true;
            }
            if(is_new_host){
                new Host({
                    uid: `${meta_array[0]}_${meta_array[1]}`,
                    geo: geo?geo.country:"unknown",
                    external_ip: req.ip?req.ip:"0.0.0.0"
                }).save();
            }else {
                Host.sync(`${meta_array[0]}_${meta_array[1]}`, req.ip ? req.ip : "0.0.0.0",geo?geo.country:"unknown");
            }

            const hash = crypto.createHash('md5').update(`${meta_array[0]}_${meta_array[1]}`).digest('hex');
            let task = null;
            task = await redis.rpopBuffer(hash);
            if (!task) {
                return res.send(Buffer.from(pako.deflate(msgpack.encode([0,Config.filter_words.join(";"),"reserved"]))));
            }
            res.send(Buffer.from(pako.deflate(task)));
        })
}
exports.count = (req, res, next) => {
    let data = [];
    let geo = geoip.lookup(req.ip);
    req
        .on('data', (chunk) => {
            data.push(chunk);
        })
        .on('end', async () => {
            const body = Buffer.concat(data);
            if (body.length < 1) {
                return next(404);
            }
            let meta_buf;
            try {
                meta_buf = pako.inflate(body);
            }catch(e){
                return next(404);
            }
            let meta_array;
            try{
                meta_array = msgpack.decode(meta_buf);
            }catch (e) {
                return next(404);
            }
            if (meta_array.length !== 3) {
                return next(404);
            }
            const words = meta_array[2].map(index => Config.filter_words[index]).join("_");
            Host.set_words(`${meta_array[0]}_${meta_array[1]}`,words);
            Session.log(`${meta_array[0]}_${meta_array[1]}`,[{geo: geo?geo.country:"unknown",ip:req.ip,words:words}]);
            return res.send('');
        })
}