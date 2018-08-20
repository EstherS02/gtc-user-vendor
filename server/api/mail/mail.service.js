'use strict';

const roles = require('../../config/roles');
const status = require('../../config/status');
const service = require('../service');
const config = require('../../config/environment');
const mailStatus = require('../../config/mail-status');
const model = require('../../sqldb/model-connect');

export function createMail(bodyParams, users) {
	var mail = {};
	var usersArray = [];
	var mailArray = [];
	var mailModelName = 'Mail';
	var userMailModelName = 'UserMail';
	var agenda = require('../../app').get('agenda');

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
					mail_id: mail.id,
					user_id: mail.from_id,
					mail_status: mailStatus['SENT'],
					status: status['ACTIVE'],
					created_on: new Date()
				}, {
					mail_id: mail.id,
					user_id: mail.from_id
				});
			} else {
				return Promise.reject(true);
			}
		}).then((fromUserMailResponse) => {
			var mailObject = {};

			mailObject['from'] = config.smtpTransport.from;
			mailObject['subject'] = mail.subject;
			mailObject['replyTo'] = "gtc-user-" + mail.from_id + "@ibcpods.com";
			mailObject['html'] = mail.message;
			mailObject['to'] = [];

			for (var i = 0; i < users.length; i++) {
				mailObject['to'].push(users[i].email);
				usersArray.push(service.createRow(userMailModelName, {
					mail_id: mail.id,
					user_id: users[i].id,
					mail_status: mailStatus['UNREAD'],
					status: status['ACTIVE'],
					created_on: new Date()
				}));
			}
			mailArray.push(mailObject);
			return Promise.all(usersArray);
		}).then((result) => {
			console.log("mailArray", mailArray);
			agenda.now(config.jobs.email, {
				mailArray: mailArray
			});
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

export function deleteMail(queryObj) {
	var includeArr = [];
	var mailModelName = 'Mail';
	var userMailModelName = 'UserMail';

	return new Promise((resolve, reject) => {
		service.findOneRow(userMailModelName, queryObj, includeArr)
			.then((exists) => {
				if (exists) {
					return service.updateRecord(userMailModelName, {
						mail_status: mailStatus['DELETED']
					}, queryObj)
				} else {
					return Promise.resolve(null);
				}
			}).then((result) => {
				resolve(result);
			}).catch((error) => {
				reject(error);
			});
	});
}

export function removeMail(queryObj) {
	var includeArr = [];
	var userMail = {};
	var mailModelName = 'Mail';
	var userMailModelName = 'UserMail';

	console.log("queryObj", queryObj);

	return new Promise((resolve, reject) => {
		service.findOneRow(userMailModelName, queryObj, includeArr)
			.then((exists) => {
				if (exists) {
					userMail = exists;
					return service.destroyRecord(userMailModelName, userMail.id);
				} else {
					return Promise.reject(true);
				}
			}).then((destoryResponse) => {
				if (destoryResponse) {
					return service.countRows(userMailModelName, {
						mail_id: userMail.mail_id
					});
				} else {
					return Promise.reject(true);
				}
			}).then((userMailCount) => {
				if (userMailCount > 0) {
					return Promise.resolve(true);
				} else {
					return service.destroyRecord(mailModelName, userMail.mail_id);
				}
			}).then((result) => {
				resolve(true);
			}).catch((error) => {
				reject(error);
			});
	});
}

export function removeManyMail(queryObj) {
	var includeArr = [];
	var userMail = {};
	var userMailModelName = 'UserMail';

	return new Promise((resolve, reject) => {
		return service.destroyManyRecord(userMailModelName, queryObj.ids)
			.then((destoryResponse) => {
				if (destoryResponse) {
					return service.countRows(userMailModelName, {
						mail_id: userMail.mail_id
					});
				} else {
					return Promise.reject(true);
				}
			}).then((userMailCount) => {
				if (userMailCount > 0) {
					return Promise.resolve(true);
				} else {
					return service.destroyRecord(mailModelName, userMail.mail_id);
				}
			}).then((result) => {
				resolve(true);
			}).catch((error) => {
				reject(error);
			});
	});
}