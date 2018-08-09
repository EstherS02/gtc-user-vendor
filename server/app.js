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

// Setup server
var app = express();
var server = http.createServer(app);

//Socket IO connect with server
var io = require('socket.io')(server);
socketMsg(io);



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