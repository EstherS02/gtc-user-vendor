'use strict';

const status = require('../../config/status');

const model = require('../../sqldb/model-connect');

export function findRows(modelName, queryObj, offset, limit, field, order) {
	return new Promise((resolve, reject) => {
		model[modelName].findAndCountAll({
			where: queryObj,
			offset: offset,
			limit: limit,
			order: [
				[field, order]
			],
			raw: true
		}).then(function(rows) {
			resolve(rows);
		}).catch(function(error) {
			reject(error);
		});
	});
}

export function findRow(modelName, id) {
	return new Promise((resolve, reject) => {
		model[modelName].find({
			where: {
				id: id
			},
			include: [{
				model: model["User"],
				attributes: {
					exclude: ["hashed_pwd", "salt"]
				}
			}]
		}).then(function(row) {
			if (row) {
				resolve(row);
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			reject(error);
		});
	});
}

export function findOneRow(modelName, queryObj) {
	return new Promise((resolve, reject) => {
		model[modelName].findfindOne({
			where: queryObj
		}).then(function(row) {
			if (row) {
				resolve(row);
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			reject(error);
		});
	});
}

export function createRow(modelName, bodyParams) {
	return new Promise((resolve, reject) => {
		model[modelName].create(bodyParams)
			.then(function(row) {
				if (row) {
					resolve(row);
				} else {
					resolve(null);
				}
			}).catch(function(error) {
				reject(error);
			});
	})
}

export function updateRow(modelName, bodyParams, id) {
	return new Promise((resolve, reject) => {
		model[req.endpoint].update(req.body, {
			where: {
				id: req.params.id
			}
		}).then(function(row) {
			if (row) {
				resolve(row);
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			reject(error);
		})
	})
}

export function destroyManyRow(modelName, ids) {
	return new Promise((resolve, reject) => {
		model[modelName].update({
			status: status["DELETED"],
			deleted_at: new Date()
		}, {
			where: {
				id: ids
			}
		}).then(function(rows) {
			if (rows[0] > 0) {
				resolve(rows);
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			reject(error);
		});
	});
}

export function destroyRow(modelName, id) {
	return new Promise((resolve, reject) => {
		model[modelName].update({
			status: status["DELETED"],
			deleted_at: new Date()
		}, {
			where: {
				id: id
			},
			returning: true,
			plain: true
		}).then(function(row) {
			if (row) {
				resolve(row);
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			reject(error);
		});
	});
}