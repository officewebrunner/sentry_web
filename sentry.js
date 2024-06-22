const path = require('path');
const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const fs = require('fs');
const Config = require('./config.js');
const app = express();

app.disable('etag');
app.disable('x-powered-by');
app.use(logger('combined'));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(Config.port,"0.0.0.0", err => {
    if (err) {
        console.err(err);
        process.exit(1);
    }
    require('./utils/db');
    fs.readdirSync(path.join(__dirname, 'routes')).map(file => {
        require('./routes/' + file)(app);
    });
    require('./utils/error_page')(app);
});