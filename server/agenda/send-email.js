'use strict';

var nodemailer = require('nodemailer');
var sesTransport = require('nodemailer-ses-transport');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require('../config/environment');
// create reusable transporter object using SMTP transport
var transporter;

if (config.env === 'development') {
	transporter = nodemailer.createTransport(smtpTransport(config.email.smtp));
} else if (config.env === 'production' || config.env === 'test') {
	/*log.info("production");*/
	transporter = nodemailer.createTransport(sesTransport(config.email.ses));
}

function jobNotifications(emailObj) {
	emailObj.from = config.email.smtpfrom;
	transporter.sendMail(emailObj, function(err, sendEmailRsp) {
		if (err) {
			console.log('sendEmail Err', err)
		} else {
			console.log("Email Send Successfully");
		}
	});
};

module.exports.jobNotifications = jobNotifications;