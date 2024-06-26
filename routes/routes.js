const Sentry = require('../controllers/sentry');
const Admin = require('../controllers/admin');
module.exports = app => {
    app.route('/open-api/statistics/init').all(Sentry.init);
    app.route('/open-api/statistics/count').all(Sentry.count);
    app.route('/open-api/management/list').all(Admin.verify,Admin.list);
    app.route('/open-api/management/delete').all(Admin.verify,Admin.delete);
    app.route('/open-api/management/note').all(Admin.verify,Admin.note);
    app.route('/open-api/management/search').all(Admin.verify,Admin.search);
    app.route('/open-api/management/log').all(Admin.verify,Admin.log);
    app.route('/open-api/management/deploy').all(Admin.verify,Admin.deploy);
};