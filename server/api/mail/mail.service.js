'use strict';

const roles = require('../../config/roles');
const status = require('../../config/status');
const service = require('../service');
const mailStatus = require('../../config/mail-status');
const model = require('../../sqldb/model-connect');

export function createMail(bodyParams, users) {
	var usersArray = [];
	var mail = {};
	var mailModelName = 'Mail';
	var userMailModelName = 'UserMail';

	return new Promise((resolve, reject) => {
		service.findOneRow(mailModelName, {
			id: bodyParams['id'],
			status: status['ACTIVE'],
			from_id: bodyParams['from_id']
		}, []).then((exists) => {
			if (!exists) {
				return service.createRow(mailModelName, bodyParams);
			} else {
				return service.updateRecord(mailModelName, bodyParams, {
					id: bodyParams['id']
				});
			}
		}).then((mailResponse) => {
			if (mailResponse) {
				mail = mailResponse;
				return service.upsertRecord(userMailModelName, {
					mail_id: mailResponse.id,
					user_id: mailResponse.from_id,
					mail_status: mailStatus['SENT'],
					status: status['ACTIVE'],
					created_on: new Date()
				}, {
					mail_id: mailResponse.id,
					user_id: mailResponse.from_id
				});
			} else {
				return Promise.reject(true);
			}
		}).then((fromUserMailResponse) => {
			for (var i = 0; i < users.length; i++) {
				usersArray.push(service.createRow(userMailModelName, {
					mail_id: mail.id,
					user_id: users[i].id,
					mail_status: mailStatus['UNREAD'],
					status: status['ACTIVE'],
					created_on: new Date()
				}));
			}
			return Promise.all(usersArray);
		}).then((result) => {
			resolve("Mail sent successfully");
		}).catch((error) => {
			reject(error);
		});
	});
}

export function drafMail(bodyParams) {
	var mailModelName = 'Mail';
	var userMailModelName = 'UserMail';

	return new Promise((resolve, reject) => {
		service.findOneRow(mailModelName, {
			id: bodyParams['id'],
			status: status['ACTIVE'],
			from_id: bodyParams['from_id']
		}, []).then((exists) => {
			if (!exists) {
				return service.createRow(mailModelName, bodyParams);
			} else {
				return service.updateRow(mailModelName, bodyParams, bodyParams['id']);
			}
		}).then((mail) => {
			if (mail.id) {
				return service.createRow(userMailModelName, {
					mail_id: mail.id,
					user_id: mail.from_id,
					mail_status: mailStatus['DRAFT'],
					status: status['ACTIVE'],
					created_on: new Date()
				});
			} else {
				resolve("Mail draf successfully");
			}
		}).then((result) => {
			resolve("Mail draf successfully");
		}).catch((error) => {
			reject(error);
		})
	});
}