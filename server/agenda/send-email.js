'use strict';

var nodemailer = require('nodemailer');
var sesTransport = require('nodemailer-ses-transport');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require('../config/environment');

var transporter;

if (config.env === 'development') {
    transporter = nodemailer.createTransport(smtpTransport({
        host: config.smtpTransport.host,
        port: config.smtpTransport.port,
        secure: false,
        auth: {
            user: config.smtpTransport.auth.user,
            pass: config.smtpTransport.auth.pass
        }
    }));
} else if (config.env === 'production' || config.env === 'test') {
    transporter = nodemailer.createTransport(sesTransport({
        accessKeyId: config.sesTransporter.accessKeyId,
        secretAccessKey: config.sesTransporter.secretAccessKey
    }));
}

module.exports = function(emailObj) {
    if (config.env === 'development') {
        emailObj.from = config.smtpTransport.from;
    } else if (config.env === 'production' || config.env === 'test') {
        emailObj.from = config.sesTransporter.from;
    }
    transporter.sendMail(emailObj, function(error, sendEmailRsp) {
        if (error) {
            console.log('Error:::', error);
        } else {
            console.log("Email Sent Successfully");
        }
    });
}