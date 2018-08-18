'use strict';

const agenda = require('../../agenda');
const roles = require('../../config/roles');
const status = require('../../config/status');
const provider = require('../../config/providers');
const service = require('../service');
const config = require('../../config/environment');
const mailStatus = require('../../config/mail-status');
const model = require('../../sqldb/model-connect');

export function createReplyMail(receivedMail) {
	var mail = {};
	var mailArray = [];
	var bodyParams = {};
	var mailModelName = 'Mail';
	var userMailModelName = 'UserMail';

	return new Promise((resolve, reject) => {
		service.findOneRow('User', {
			email: receivedMail.from[0].address,
			provider: provider['OWN']
		}, []).then((exists) => {
			if (exists) {
				bodyParams['from_id'] = exists.id;
				bodyParams['subject'] = receivedMail['subject'];
				bodyParams['message'] = receivedMail['html'];
				bodyParams['status'] = status['ACTIVE'];
				bodyParams['created_on'] = new Date();
				bodyParams['created_by'] = exists.first_name;
				return service.createRow(mailModelName, bodyParams);
			} else {
				return Promise.reject(true);
			}
		}).then((mailResponse) => {
			if (mailResponse) {
				mail = mailResponse;
				var toUsersArray = [];
				var receives = receivedMail['to'];
				for (var i = 0; i < receives.length; i++) {
					var queryObj = {}
					queryObj['id'] = parseInt(receives[i].address.split('-')[2].split('@')[0]);
					queryObj['provider'] = provider['OWN'];

					toUsersArray.push(service.findOneRow('User', queryObj, []))
				}
				return Promise.all(toUsersArray)
			} else {
				return Promise.reject(true);
			}
		}).then((tousers) => {
			var usersArray = [];
			var mailObject = {};

			mailObject['from'] = config.smtpTransport.from;
			mailObject['subject'] = mail.subject;
			mailObject['replyTo'] = "gtc-user-" + mail.from_id + "@ibcpods.com";
			mailObject['html'] = mail.message;
			mailObject['to'] = [];

			for (var i = 0; i < tousers.length; i++) {
				mailObject['to'].push(tousers[i].email);
				usersArray.push(service.createRow(userMailModelName, {
					mail_id: mail.id,
					user_id: tousers[i].id,
					mail_status: mailStatus['UNREAD'],
					status: status['ACTIVE'],
					created_on: new Date()
				}));
			}
			mailArray.push(mailObject);
			return Promise.all(usersArray);
		}).then((result) => {
			agenda.now(config.jobs.email, {
				mailArray: mailArray
			});
			resolve("Mail sent successfully");
		}).catch((error) => {
			reject(error);
		});
	});
}