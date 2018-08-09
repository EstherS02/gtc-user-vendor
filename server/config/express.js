/**
 * Express configuration
 */

'use strict';

import express from 'express';
import favicon from 'serve-favicon';
import morgan from 'morgan';
import shrinkRay from 'shrink-ray';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import expressValidator from 'express-validator';
import path from 'path';
import lusca from 'lusca';
import config from './environment';
import globalUser from '../auth/global-user-obj';
import expressJwt from 'express-jwt'
import session from 'express-session';
//import sequelizeDB from '../sqldb';
//import expressSequelizeSession from 'express-sequelize-session';
//var Store = expressSequelizeSession(session.Store);

var mw = require('../auth/middleware');

export default function(app) {
	var env = app.get('env');
	app.use(config.imageUrlRewritePath.base, express.static(config.images_base_path));
	if (env === 'development' || env === 'test') {
		//app.use(express.static(path.join(config.root, 'public')));
		//app.use(config.imageUrlRewritePath.products, express.static(config.upload_products_path));
		//app.use(express.static(path.join(config.root, '.tmp')));
	}

	if (env === 'production') {
		//app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
	}

	//  app.set('appPath', path.join(config.root, 'client'));
	//  app.use(express.static(app.get('appPath')));
	app.use(morgan('dev'));


	//app.set('views', `${config.root}/server/views`);
	//app.engine('html', require('ejs').renderFile);
	//  app.set('view engine', 'html');
	app.use(shrinkRay());
	app.use(bodyParser.urlencoded({
		extended: false
	}));
	app.use(bodyParser.json());
	app.use(function(req, res, next) {
		var allowedOrigins = [config.clientURL];
		var origin = req.headers.origin;
		if (allowedOrigins.indexOf(origin) > -1) {
			res.setHeader('Access-Control-Allow-Origin', origin);
		}
		res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
		res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
		res.set('Access-Control-Allow-Credentials', 'true');
		next();
	});
	//app.use(mw());
	app.use(expressValidator());
	app.use(methodOverride());
	app.use(cookieParser(config.secrets.session));
	app.use(session({
		secret: config.secrets.session,
		saveUninitialized: false,
		resave: true,
		cookie: {
			secure: false
		}
	}));

	app.use(function(req, res, next) {
		console.log("req.session", req.session['compare']);
		if (!req.session['compare']) {
			req.session['compare'] = [];
		}
		next();
	});

	if (env === 'development') {
		const webpackDevMiddleware = require('webpack-dev-middleware');
		const stripAnsi = require('strip-ansi');
		const webpack = require('webpack');
		const makeWebpackConfig = require('../../webpack.make');
		const webpackConfig = makeWebpackConfig({
			DEV: true
		});
		const compiler = webpack(webpackConfig);
		const browserSync = require('browser-sync').create();

		/**
		 * Run Browsersync and use middleware for Hot Module Replacement
		 */
		browserSync.init({
			open: false,
			logFileChanges: false,
			proxy: `localhost:${config.port}`,
			ws: true,
			middleware: [
				webpackDevMiddleware(compiler, {
					noInfo: false,
					stats: {
						colors: true,
						timings: true,
						chunks: false
					}
				})
			],
			port: config.browserSyncPort,
			plugins: ['bs-fullscreen-message']
		});

		/**
		 * Reload all devices when bundle is complete
		 * or send a fullscreen error message to the browser instead
		 */
		compiler.plugin('done', function(stats) {
			console.log('webpack done hook');
			if (stats.hasErrors() || stats.hasWarnings()) {
				return browserSync.sockets.emit('fullscreen:message', {
					title: 'Webpack Error:',
					body: stripAnsi(stats.toString()),
					timeout: 100000
				});
			}
			browserSync.reload();
		});
	}

	if (env === 'development' || env === 'test') {
		app.use(errorHandler()); // Error handler - has to be last
	}
}