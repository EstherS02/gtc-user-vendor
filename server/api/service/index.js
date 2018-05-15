'use strict';

const status = require('../../config/status');
const position = require('../../config/position');

const model = require('../../sqldb/model-connect');

export function findRows(modelName, queryObj, offset, limit, field, order) {
	var includeArr = [];
	if (queryObj.populate) {
		var models = queryObj.populate.split(',');
		for (var i = 0; i < models.length; i++) {
			includeArr.push({
				model: model[models[i]]
			})
		}
		delete queryObj.populate;
	}
	return new Promise((resolve, reject) => {
		model[modelName].findAndCountAll({
			where: queryObj,
			include: includeArr,
			offset: offset,
			limit: limit,
			order: [
				[field, order]
			]
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
			}
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
		model[modelName].update(bodyParams, {
			where: {
				id: id
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