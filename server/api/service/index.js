'use strict';

const status = require('../../config/status');
const position = require('../../config/position');

const model = require('../../sqldb/model-connect');

export function findRows(modelName, queryObj, offset, limit, field, order, includeArr) {

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

export function findAllRows(modelName, includeArr, queryObj, offset, limit, field, order) {
	var result = {};
	return new Promise((resolve, reject) => {
		model[modelName].findAll({
			include: includeArr,
			where: queryObj,
			offset: offset,
			limit: limit,
			order: [
				[field, order]
			]
		}).then(function(rows) {
			var convertRowsJSON = [];
			if (rows.length > 0) {
				convertRowsJSON = JSON.parse(JSON.stringify(rows));
				model[modelName].count({
					where: queryObj
				}).then(function(count) {
					result.count = count;
					result.rows = convertRowsJSON;
					resolve(result);
				}).catch(function(error) {
					reject(error);
				});
			} else {
				result.count = 0;
				result.rows = convertRowsJSON;
				resolve(result);
			}
		}).catch(function(error) {
			reject(error);
		});
	});
}

export function findRow(modelName, id, includeArr) {
	return new Promise((resolve, reject) => {
		model[modelName].find({
			include: includeArr,
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

export function findOneRow(modelName, queryObj, includeArr) {
	return new Promise((resolve, reject) => {
		model[modelName].findOne({
			include: includeArr,
			where: queryObj
		}).then(function(row) {
			if (row) {
				resolve(row.toJSON());
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

export function createBulkRow(modelName, bodyParams) {
	return new Promise((resolve, reject) => {
		model[modelName].bulkCreate(bodyParams, {
				individualHooks: true
			})
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

export function upsert(modelName, queryObj, includeArr, data) {
	console.log('data',data);
	service.findOneRow(modelName, queryObj, includeArr)
		.then(function(results) {
				if (results) {
					console.log('new',results)
					var id = results;
					data.last_updated_on = new Date();

					// res.status(200).send(results);
					service.updateRow(modelName, data, id).then(function(response) {
						console.log("Update", response)
						return;
					});
				} else {
					data.created_on = new Date();
					service.createRow(modelName, data).then(function(response) {
						console.log("News", response)
						return;
					});
				}
			});
		}