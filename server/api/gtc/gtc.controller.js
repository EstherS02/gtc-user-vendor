'use strict';

const mv = require('mv');
const _ = require('lodash');
const sequelize = require('sequelize');

const service = require('../service');
const config = require('../../config/environment');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const populate = require('../../utilities/populate')
const model = require('../../sqldb/model-connect');

export function indexA(req, res) {
	var productQueryObj = {};
	var marketPlaceTypeQueryObj = {};

	productQueryObj['status'] = status["ACTIVE"];
	marketPlaceTypeQueryObj['status'] = status["ACTIVE"];

	productQueryObj['product_location'] = 3;

	console.log('productQueryObj', productQueryObj);

	model['MarketplaceType'].findAll({
		where: marketPlaceTypeQueryObj,
		include: [{
			model: model['Product'],
			where: productQueryObj,
			required: false
		}],
		group: ['MarketplaceType.id']
	}).then(function(results) {
		res.status(200).send(JSON.parse(JSON.stringify(results)));
		return;
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return
	});

	var marketplaceTypeQueryObj = {};
	marketplaceTypeQueryObj['status'] = status["ACTIVE"];

	model['Category'].findAll({
		where: marketplaceTypeQueryObj,
		include: [{
			model: model['SubCategory'],
			where: marketplaceTypeQueryObj
		}]
	}).then(function(results) {
		res.status(200).send(JSON.parse(JSON.stringify(results)));
		return;
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return
	});
}

export function index(req, res) {
	var offset, limit, field, order;
	var queryObj = {};
	var searchObj = {};
	var searchArray = [];

	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
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

	if (queryObj.startDate && queryObj.endDate) {
		if (queryObj.columnName) {
			queryObj[queryObj.columnName] = {
				'$gte': new Date(parseInt(queryObj.startDate)),
				'$lte': new Date(parseInt(queryObj.endDate))
			}
			delete queryObj.columnName;
		}
		delete queryObj.startDate;
		delete queryObj.endDate;
	}

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

	console.log('queryObj', queryObj);

	service.findRows(req.endpoint, queryObj, offset, limit, field, order)
		.then(function(rows) {
			res.status(200).send(rows);
			return;
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}

export function getAll(req, res) {
	var offset, limit, field, order;
	var queryObj = {};
	var searchObj = {};
	var searchArray = [];
	var includeArray = [];

	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
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

	if (queryObj.startDate && queryObj.endDate) {
		if (queryObj.columnName) {
			queryObj[queryObj.columnName] = {
				'$gte': new Date(parseInt(queryObj.startDate)),
				'$lte': new Date(parseInt(queryObj.endDate))
			}
			delete queryObj.columnName;
		}
		delete queryObj.startDate;
		delete queryObj.endDate;
	}

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

	includeArray.push({
		model: model['Product'],
		include: [{
			model: model['Vendor']
		}]
	})

	service.findAllRows(req.endpoint, includeArray, queryObj, offset, limit, field, order)
		.then(function(rows) {
			res.status(200).send(rows);
			return;
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}

export function show(req, res) {
	var queryObj = req.query;

	service.findOneRow(req.endpoint, queryObj)
		.then(function(result) {
			if (result) {
				return res.status(200).send(result);
			} else {
				return res.status(404).send("Not found");
			}
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}

export function findById(req, res) {
	var paramsID = req.params.id;
	let includeArr;

	if (req.query.populate)
		includeArr = populate.populateData(req.query.populate);
	else
		includeArr = [];

	delete req.query.populate;

	service.findRow(req.endpoint, paramsID, includeArr)
		.then(function(result) {
			if (result) {
				return res.status(200).send(result);
			} else {
				return res.status(404).send("Not found");
			}
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}


export function createBulk(req, res) {

	var bodyParamsArray = [];

	for (var i = 0; i < req.body.length; i++) {
		req.body[i].status = status["ACTIVE"];
		req.body[i].created_on = new Date();
		bodyParamsArray.push(req.body[i]);
	}

	service.createBulkRow(req.endpoint, bodyParamsArray)
		.then(function(result) {
			if (result) {
				return res.status(201).send(result);
			} else {
				return res.status(404).send("Not found");
			}
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}

export function create(req, res) {
	var bodyParams = req.body;

	bodyParams["created_on"] = new Date();

	service.createRow(req.endpoint, bodyParams)
		.then(function(result) {
			if (result) {
				return res.status(201).send(result);
			} else {
				return res.status(404).send("Not found");
			}
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}

export function update(req, res) {
	var paramsID = req.params.id;
	var bodyParams = req.body;

	bodyParams["last_updated_on"] = new Date();

	service.findRow(req.endpoint, paramsID)
		.then(function(row) {
			if (row) {
				delete bodyParams["id"];
				service.updateRow(req.endpoint, bodyParams, paramsID)
					.then(function(result) {
						if (result) {
							return res.status(200).send(result);
						} else {
							return res.status(404).send("Unable to update");
						}
					}).catch(function(error) {
						console.log('Error :::', error);
						res.status(500).send("Internal server error");
						return
					})
			}
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}

export function destroyMany(req, res) {
	const ids = req.body.ids;

	service.destroyManyRow(req.endpoint, ids)
		.then(function(results) {
			if (results[0] > 0) {
				res.status(200).send(results);
				return;
			} else {
				res.status(404).send("Unable to delete");
				return;
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		});
}

export function destroy(req, res) {
	const paramsID = req.params.id;

	service.findRow(req.endpoint, paramsID)
		.then(function(row) {
			if (row) {
				service.destroyRow(req.endpoint, paramsID)
					.then(function(result) {
						if (result) {
							res.status(200).send(result);
							return
						} else {
							return res.status(404).send("Unable to delete");
						}
					}).catch(function(error) {
						console.log('Error:::', error);
						res.status(500).send("Internal server error");
						return;
					});
			} else {
				return res.status(404).send("Not found");
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		});
}

exports.upload = function(req, res) {
	var file = req.files.file;
	var uploadPath = config.images_base_path + "/" + file.originalFilename;

	mv(file.path, uploadPath, {
		clobber: true,
		mkdirp: true
	}, function(error) {
		if (error) {
			console.log('Error:::', error)
			return res.status(400).send("Failed to upload");
		} else {
			var image = config.imageUrlRewritePath.base + file.originalFilename;
			return res.status(201).json({
				imageURL: image
			});
		}
	});
};

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}