'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');


//Dynamic search for all endpoints

/* export function search(req, res) {

	var searchArray = [];
	var queryObj = {};

	if (!req.query.text) {
		res.send(400).send("Missing text query to search.");
	}
	if (!req.query.fields) {
		res.send(400).send("Missing which fields to search.");
	}

	var searchText = req.query.text;
	var searchFields = req.query.fields;
	searchFields = searchFields.split(",");

	for (var i = 0; i < searchFields.length; i++) {
		var searchObj = {}
		searchObj[searchFields[i]] = {
			like: '%' + searchText + '%'
		}
		searchArray.push(searchObj);
	}
	delete req.query.text;
	delete req.query.fields;

	queryObj = req.query;
	queryObj['$or'] = searchArray;

	model[req.endpoint].findAndCountAll({
		where: queryObj
	}).then(function(rows) {
		return res.status(200).send(rows);
	}).catch(function(error) {
		console.log('Error :::', error);
		return res.status(500).send("Internal server error");
	});
} */


// To find all the records in the table

export function index(req, res) {
	var offset, limit, field, order;
	var queryObj = {};
	var searchObj = {};
	var searchArray = [];

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	if (req.query.fields && req.query.text) {
		var searchText = req.query.text;
		var searchFields = req.query.fields;
		searchFields = searchFields.split(",");
		for (var i = 0; i < searchFields.length; i++) {
			var obj = {}
			obj[searchFields[i]] = {
				like: '%' + searchText + '%'
			}
			searchArray.push(obj);
		}
		searchObj['$or'] = searchArray;
		delete req.query.text;
		delete req.query.fields;
	}

	queryObj = Object.assign(searchObj, req.query);

	if (!queryObj.status) {
		queryObj['status'] = {
			'$ne': status["DELETED"]
		}
	} else {
		if (queryObj.status == status["DELETED"]) {
			queryObj['status'] = {
				'$eq': status["DELETED"]
			}
		}
	}

	model[req.endpoint].findAndCountAll({
		where: queryObj,
		offset: offset,
		limit: limit,
		order: [
			[field, order]
		],
		raw: true
	}).then(function(rows) {
		res.status(200).send(rows);
		return;
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return
	});
}

// To find first record of the table for the specified condition

export function show(req, res) {

	var includeArr = [];

	for (var i = 0; i < reference[req.endpoint].length; i++) {
		if (typeof reference[req.endpoint][i] === 'object' && reference[req.endpoint][i].model_as) {
			includeArr.push({
				model: model[reference[req.endpoint][i].model_name],
				as: reference[req.endpoint][i].model_as
			});
		} else {
			includeArr.push({
				model: model[reference[req.endpoint][i].model_name]
			});
		}
	}


	console.log("includeArr", includeArr)

	model[req.endpoint].findOne({
			include: includeArr,
			where: req.query

		}).then(function(row) {
			if (row) {
				res.status(200).send(row);
				return;
			} else {
				res.status(404).send("Not Found");
				return;
			}

		})
		.catch(function(error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}

//  To find the record of known id

export function findById(req, res) {

	var includeArr = [];

	for (var i = 0; i < reference[req.endpoint].length; i++) {
		if (typeof reference[req.endpoint][i] === 'object' && reference[req.endpoint][i].model_as) {
			includeArr.push({
				model: model[reference[req.endpoint][i].model_name],
				as: reference[req.endpoint][i].model_as
			});
		} else {
			includeArr.push({
				model: model[reference[req.endpoint][i].model_name]
			});
		}
	}


	console.log("includeArr", includeArr)

	model[req.endpoint].find({
			where: {
				id: req.params.id
			},
			include: includeArr

		})
		.then(function(row) {
			if (row) {
				res.status(200).send(row);
				return
			} else {
				res.status(404).send("Not Found");
				return;
			}
		})
		.catch(function(error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}

// To create

export function create(req, res) {

	req.body['created_on'] = new Date();

	model[req.endpoint].create(req.body)
		.then(function(row) {
			res.status(201).send("Created");
			return;
		})
		.catch(function(error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}

// To update 



export function update(req, res) {
	model[req.endpoint].find({
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(function(entity) {
			if (entity) {
				model[req.endpoint].update(req.body, {
						where: {
							id: req.params.id
						},
						individualHooks: true
					})
					.then(() => {
						res.status(200).send("Updated");
						return;
					}).catch(function(err) {
						res.send(err);
						return;
					});
			} else {

				res.status(404).send("Not Found");
				return;

			}
		})
		.catch(function(err) {
			res.send(err);
			return;
		});
}

// For soft delete


export function softDelete(req, res) {
	if (req.body.id) {
		Reflect.deleteProperty(req.body, 'id');
	}

	var deleted_at = new Date();

	model[req.endpoint].update({
			status: 10,
			deleted_at: deleted_at
		}, {
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(function(rows) {

			res.status(200).send("Deleted");
			return;

		})
		.catch(function(error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}

export function destroyMany(req, res) {
	const ids = req.body.ids;
	model[req.endpoint].update({
		status: status["DELETED"],
		deleted_at: new Date()
	}, {
		where: {
			id: ids
		}
	}).then(function(rows) {
		if (rows[0] > 0) {
			res.status(200).send(rows);
			return;
		} else {
			res.status(404).send("Unable to delete users");
			return;
		}
	}).catch(function(error) {
		console.log('Error:::', error);
		res.status(500).send("Internal server error");
		return;
	})
}

export function destroy(req, res) {
	model[req.endpoint].findById(req.params.id)
		.then(function(row) {
			if (row) {
				model[req.endpoint].update({
					status: status["DELETED"],
					deleted_at: new Date()
				}, {
					where: {
						id: req.params.id
					},
					returning: true,
					plain: true
				}).then(function(result) {
					res.status(200).send(result);
					return
				}).catch(function(error) {
					res.status(500).send("Internal server error");
					return;
				});
			} else {
				res.status(404).send("Not found");
				return;
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		})
}