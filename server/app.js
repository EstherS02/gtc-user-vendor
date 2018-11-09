/**
 * Main application file
 */

'use strict';

import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import _ from 'lodash';
import helpers from './lib/helpers';
import paginationHelpers from './lib/handlebars-pagination-helper';
import sequelizeDB from './sqldb';
import config from './config/environment';
import fs from 'fs';
import http from 'http';
import https from 'https';
var socketMsg = require('./sockets/socket-messages').socketMsg;
var mailListener = require('./components/mail-listener');
var agenda = require('./agenda');
var sendEmailNew = require('./agenda/send-email-new');
//var vendorPayouts = require('./agenda/vendor-payouts').vendorPayouts;
var planRenewal = require('./agenda/plan-auto-renewal').planRenewal;
var bulkUserPlanRenewal = require('./agenda/bulk-user-plan-auto-renewal').bulkUserPlanRenewal;
var subscriptionAutoRenewal = require('./agenda/subscription-auto-renewal').subscriptionAutoRenewal;
var featureProductAutoRenewal = require('./agenda/feature-product-auto-renewal').featureProductAutoRenewal;
var starterPlanExpire = require('./agenda/starter-plan-expire').starterPlanExpire;
var featureProductExpire = require('./agenda/feature-product-expire').featureProductExpire;
var subscriptionExpire = require('./agenda/subscription-expire').subscriptionExpire;
var mailListener = require('./components/mail-listener');
var mailService = require('./api/mail/reply-mail.service');
var aliExpressScrape = require('./agenda/aliexpress-scrape');
var ebayInventory = require('./agenda/ebay-inventory');
var orderEmail = require('./agenda/order-email');
var orderItemPayout = require('./agenda/order-item-payout');
var amazonImportJob = require('./agenda/amazon-import');
var vendorPayoutsNew = require('./agenda/vendor-payouts-new');
var orderNotification = require('./agenda/order-notification');

agenda.define(config.jobs.email, sendEmailNew);
agenda.define(config.jobs.aliExpressScrape, aliExpressScrape);
agenda.define(config.jobs.ebayInventory, ebayInventory);
agenda.define(config.jobs.orderEmail, orderEmail);
agenda.define(config.jobs.orderItemPayout, orderItemPayout);
//agenda.define(config.jobs.vendorPayouts, vendorPayouts);
agenda.define(config.jobs.planRenewal, planRenewal);
agenda.define(config.jobs.bulkUserPlanRenewal, bulkUserPlanRenewal);
//agenda.define(config.jobs.subscriptionAutoRenewal, subscriptionAutoRenewal);
agenda.define(config.jobs.featureProductAutoRenewal, featureProductAutoRenewal);
agenda.define(config.jobs.starterPlanExpire, starterPlanExpire);
agenda.define(config.jobs.featureProductExpire, featureProductExpire);
agenda.define(config.jobs.subscriptionExpire, subscriptionExpire);
agenda.define(config.jobs.amazonImportJob, amazonImportJob);
agenda.define(config.jobs.vendorPayoutsNew, vendorPayoutsNew);
agenda.define(config.jobs.orderNotification, orderNotification);

agenda.on('ready', function() {
	console.log('agenda onReady');
	//agenda.every('8 hours', 'vendorPayouts');
	agenda.every('8 hours', config.jobs.orderItemPayout);
	agenda.every('8 hours', config.jobs.vendorPayoutsNew);
	agenda.every('12 hours', 'planRenewal');
	agenda.every('12 hours', 'bulkUserPlanRenewal');
	//agenda.every('12 hours', 'subscriptionAutoRenewal');
	agenda.every('12 hours', 'featureProductAutoRenewal');
	agenda.every('12 hours', 'starterPlanExpire');
	agenda.every('12 hours', 'featureProductExpire');
	agenda.every('12 hours', 'subscriptionExpire');
	agenda.start();
});

mailListener.start();

mailListener.on("server:connected", function() {
	console.log("imapConnected");
});

mailListener.on("server:disconnected", function() {
	console.log("imapDisconnected");
});

mailListener.on("error", function(err) {
	console.log("ERROR", err);
});

mailListener.on("mail", function(mail, seqno, attributes) {
	mailService.createReplyMail(mail);
});

mailListener.on("attachment", function(attachment) {
	console.log("attachment.path", attachment.path);
});

// Setup server
var app = express();

var hbs = exphbs.create({
	extname: '.hbs',
	layoutsDir: path.join(__dirname + '/views/layouts/'),
	partialsDir: path.join(__dirname + '/views/partials/'),
	defaultLayout: 'default/index',
	helpers: _.assign(helpers, paginationHelpers)
});

app.use(express.static(path.join(__dirname + '/assets/')));
app.engine('.hbs', hbs.engine);
app.set('views', path.join(__dirname + '/views/layouts/'));
app.set('view engine', '.hbs');
app.set('agenda', agenda);

var env = app.get('env');

if (env === 'development') {
	var privateKey = fs.readFileSync(path.join(__dirname + '/ssl_certificate/server.key'), 'utf8');
	var ssl_certificate = fs.readFileSync(path.join(__dirname + '/ssl_certificate/server.crt'), 'utf8');
	var ssl_credentials = {
		key: privateKey,
		cert: ssl_certificate
	};
}

var httpServer = http.createServer(app);

//Socket IO connect with server
var io = require('socket.io')(httpServer);
socketMsg(io);

if (env === 'development') {
	var httpsServer = https.createServer(ssl_credentials, app);
}

require('./config/express').default(app);
require('./routes').default(app);

// Start server
function startServer() {
	app.angularFullstack = httpServer.listen(config.port, config.ip, function() {
		console.log('Express http server listening on %d, in %s mode', config.port, app.get('env'));
	});

	if (env === 'development') {
		app.httpsAngularFullstack = httpsServer.listen(9010, config.ip, function() {
			console.log('Express https server listening on 9010, in %s mode', config.port, app.get('env'));
		});
	}
}

sequelizeDB.authenticate()
	.then(startServer)
	.catch(function(err) {
		console.log('Server failed to start due to error: %s', err);
	});

// Expose app
exports = module.exports = app;