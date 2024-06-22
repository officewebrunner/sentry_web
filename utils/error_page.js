module.exports = app => {
    app.use( (req, res, next) => {
        res.connection.destroy();
    });
    app.use( (err, req, res, next) => {
        if (err instanceof Error) {
            console.error(err.message);
            //notify to pm2.
            res.connection.destroy();
        }else {
            res.connection.destroy();
        }
    });
};