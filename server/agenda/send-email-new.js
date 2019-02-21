'use strict';

var nodemailer = require('nodemailer');
var sesTransport = require('nodemailer-ses-transport');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require('../config/environment');

var transporter = nodemailer.createTransport(smtpTransport({
	host: config.smtpTransport.host,
	port: config.smtpTransport.port,
	secure: false,
	auth: {
		user: config.smtpTransport.auth.user,
		pass: config.smtpTransport.auth.pass
	}
}));

module.exports = function(email, done) {
	const arr = email.attrs.data.mailArray;
	arr.forEach(function(emailObj) {

		if (config.env === 'development') {
			emailObj.from = config.smtpTransport.from;
		} else if (config.env === 'production' || config.env === 'test') {
			emailObj.from = config.smtpTransport.from;
		}

		transporter.sendMail(emailObj, function(error, response) {
			if (error) {
				console.log("Error here:::", error);
				} else {
				console.log("response", response);
			}
		});
	});
	done();
}