/**
 * Main application file
 */

'use strict';

import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import helpers from './lib/helpers';
import sequelizeDB from './sqldb';
import config from './config/environment';
import http from 'http';

// Setup server
var app = express();

var hbs = exphbs.create({
    extname: '.hbs',
    layoutsDir: path.join(__dirname + '/views/layouts/'),
    partialsDir: path.join(__dirname + '/views/partials/'),
    defaultLayout: 'default/index',
    helpers: helpers
});

app.use(express.static(path.join(__dirname + '/assets/')));
app.engine('.hbs', hbs.engine);
app.set('views', path.join(__dirname + '/views/layouts/'));
app.set('view engine', '.hbs');


var server = http.createServer(app);
require('./config/express').default(app);
require('./routes').default(app);

// Start server
function startServer() {
	app.angularFullstack = server.listen(config.port, config.ip, function() {
		console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
	});
}

sequelizeDB.authenticate()
	.then(startServer)
	.catch(function(err) {
		console.log('Server failed to start due to error: %s', err);
	});

// Expose app
exports = module.exports = app;