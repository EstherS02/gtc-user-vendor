'use strict';

const sequelize = require('sequelize');
const service = require('../service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');

export async function notificationCounts(userId) {
	const result = {};
	try {
		const notificationModelName = "Notification";
		const queryObj = {
			user_id: userId,
			deleted_at: null,
			is_read: 1,
			status: status["ACTIVE"],
		};
		const notificationCount = await service.countRows(notificationModelName, queryObj, []);
		result.notification = notificationCount;
		return result; 
	} catch (error) {
		return error;
	}
}