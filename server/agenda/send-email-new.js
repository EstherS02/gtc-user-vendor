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
}));;


module.exports = function(email, done) {
	const arrayOfEmailObjects = email.attrs.data.mailArray;
	arrayOfEmailObjects.forEach(function(emailObj) {
		transporter.sendMail(emailObj, function(error, response) {
			if (error) {
				console.log("Error:::", error);
			} else {
				console.log("response", response);
			}
		});
	});
	done();
}