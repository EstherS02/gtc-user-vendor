'use strict';

const sequelize = require('sequelize');
const service = require('../service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const mailStatus = require('../../config/mail-status');

export async function notificationCounts(userId) {
	const result = {};
	try {
		const notificationModelName = "Notification";
		const userMailModelName = "UserMail";
		const queryObj = {
			user_id: userId,
			deleted_at: null,
			is_read: 0,
			status: status["ACTIVE"],
		};
		const notificationCount = await service.countRows(notificationModelName, queryObj, []);
		const mailQueryObj = {
			user_id: userId,
			deleted_at: null,
			mail_status: mailStatus['UNREAD'],
			status: status["ACTIVE"]
		};
		const mailCount = await service.countRows(userMailModelName, mailQueryObj, []);
		result.notification = notificationCount;
		result.mailCount = mailCount;
		return result; 
	} catch (error) {
		return error;
	}
}