const service = require('../api/service');
const sequelize = require('sequelize');
const model = require('../sqldb/model-connect');
const statusCode = require('../config/status');
const orderStatus = require('../config/order_status');
const moment = require('moment');

module.exports = function (job, done) {
    console.log
    console.log("**********JOBS CALLED")
    console.log('agenda for vendor payouts..');
}