'use strict';

const mv = require('mv');
const _ = require('lodash');
const path = require('path');
const sequelize = require('sequelize');
const async = require('async');
const moment = require('moment');
const Handlebars = require('handlebars');

const service = require('../service');
const productService = require('../product/product.service');
const cartService = require("../cart/cart.service");
const orderService = require("../order/order.service");
const reportsService = require('../reports/reports.service');
const sendEmail = require('../../agenda/send-email');
const config = require('../../config/environment');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const orderItemStatus = require('../../config/order-item-new-status');
const marketplace = require('../../config/marketplace');
const populate = require('../../utilities/populate')
const model = require('../../sqldb/model-connect');

const paymentMethod = require('../../config/payment-method');
const stripe = require('../../payment/stripe.payment');

const endpoints = require('../../config/endpoints');

export async function indexExample(req, res) {
	var limit = 10;
	var offset = 0;
	var vendorModelName = "Vendor";
	var countryModelName = "Country";
	var productModelName = "Product";
	var categoryModelName = "Category";
	var orderItemModelName = "OrderItem";
	var vendorPlanModelName = "VendorPlan";
	var subCategoryModelName = "SubCategory";

	var includeArray = [{
		model: model[productModelName],
		attributes: ['id', 'sku', 'product_name', 'product_slug', 'status', 'marketplace_id', 'marketplace_type_id', 'price', 'exclusive_sale', 'exclusive_start_date', 'exclusive_end_date'],
		include: [{
			model: model[countryModelName],
			attributes: ['id', 'name', 'code']
		}, {
			model: model[categoryModelName],
			attributes: ['id', 'name', 'code']
		}, {
			model: model[subCategoryModelName],
			attributes: ['id', 'name', 'code']
		}, {
			model: model[vendorModelName],
			attributes: [],
			include: [{
				model: model[vendorPlanModelName],
				attributes: [],
				where: {
					status: status['ACTIVE']
				}
			}]
		}, {
			model: model['ProductMedia'],
			where: {
				status: status['ACTIVE'],
				base_image: 1
			},
			attributes: ['id', 'product_id', 'type', 'url', 'base_image'],
			required: false
		}]
	}];

	try {
		const productResponse = await model[orderItemModelName].findAll({
			where: {
				'$or': [{
					order_item_status: orderItemStatus['DELIVERED']
				}, {
					order_item_status: orderItemStatus['COMPLETED']
				}],
				'$Product.marketplace_id$': marketplace['PUBLIC'],
				'$Product->Vendor->VendorPlans.start_date$': {
					'$lte': moment().format('YYYY-MM-DD')
				},
				'$Product->Vendor->VendorPlans.end_date$': {
					'$gte': moment().format('YYYY-MM-DD')
				}
			},
			attributes: [
				'id', 'product_id', [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'sales_count']
			],
			include: includeArray,
			subQuery: false,
			offset: offset,
			limit: limit,
			order: sequelize.literal('sales_count DESC'),
			group: ['OrderItem.product_id']
		});
		const products = JSON.parse(JSON.stringify(productResponse));
		await Promise.all(products.map(async (element) => {
			const currentDate = new Date();
			const exclusiveStartDate = new Date(element.Product.exclusive_start_date);
			const exclusiveEndDate = new Date(element.Product.exclusive_end_date);
			if (element.Product.exclusive_sale && (exclusiveStartDate <= currentDate && exclusiveEndDate >= currentDate)) {
				element.Product['discount'] = ((element.Product.price / 100) * element.Product.exclusive_offer).toFixed(2);
				element.Product['product_discounted_price'] = (parseFloat(element.Product['price']) - element.Product['discount']).toFixed(2);
			} else {
				delete element.Product.exclusive_start_date;
				delete element.Product.exclusive_end_date;
				delete element.Product.exclusive_offer;
			}
		}));
		return res.status(200).send(products);
	} catch (error) {
		console.log("indexExample Error:::", error);
		return res.status(500).send(error);
	}
}

export function index(req, res) {

	var offset, limit, field, order;
	var queryObj = {};
	var searchObj = {};
	var searchArray = [];
	let includeArr;

	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	if (req.query.populate)
		includeArr = populate.populateData(req.query.populate);
	else
		includeArr = [];

	delete req.query.populate;

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

	service.findRows(req.endpoint, queryObj, offset, limit, field, order, includeArr)
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
	let includeArr = [];

	if (req.query.populate)
		includeArr = populate.populateData(req.query.populate);
	else
		includeArr = [];

	delete req.query.populate;

	service.findIdRow(req.endpoint, paramsID, includeArr)
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
	const agenda = require('../../app').get('agenda');
	var bodyParams = req.body;
	bodyParams["created_on"] = new Date();
	service.createRow(req.endpoint, bodyParams)
		.then(function(result) {
			if (result) {
				if (req.endpoint == endpoints['reviews']) {
					agenda.now(config.jobs.orderNotification, {
						reviewId: result.id,
						code: config.notification.templates.productReview
					});
					return res.status(201).send(result);
				} else {
					return res.status(201).send(result);
				}
			} else {
				return res.status(404).send("Not found");
			}
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}

export function upsert(req, res) {
	var bodyParams = req.body;

	bodyParams["last_updated_on"] = new Date();

	service.upsertRow(req.endpoint, bodyParams)
		.then(function(result) {
			return res.status(201).send("Updated Successfully");
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

	service.findIdRow(req.endpoint, paramsID)
		.then(function(row) {
			if (row) {
				console.log(row);
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

	service.findIdRow(req.endpoint, paramsID)
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

exports.delete = function(req, res) {
	const paramsID = req.params.id;
	if (req.endpoint == 'ProductMedia') {
		service.findIdRow(req.endpoint, paramsID)
			.then(function(row) {
				if (row) {
					service.destroyRecord(req.endpoint, paramsID)
						.then(function(result) {
							if (result) {
								res.status(200).send({
									'response': 'Deleted Successfully'
								});
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
	} else {
		return res.status(403).send("Forbidden");
	}
}

exports.multipleUpload = function(req, res) {

	let timeInMilliSeconds = new Date().getTime();
	let files = req.files.file;

	async.mapSeries(files, function(data, callback) {

		let parsedFile = path.parse(data.originalFilename);
		let uploadPath = config.images_base_path + "/" + parsedFile.name + "-" + timeInMilliSeconds + "-" + req.user.id + parsedFile.ext;
		mv(data.path, uploadPath, {
			clobber: true,
			mkdirp: true
		}, function(error) {
			if (error) {
				console.log('Error:::', error)
				return callback(null);
			} else {
				let image = config.imageUrlRewritePath.base + parsedFile.name + "-" + timeInMilliSeconds + "-" + req.user.id + parsedFile.ext;
				return callback(null, image);
			}
		});
	}, function(err, results) {
		return res.status(201).json({
			imageURLs: results
		});
	});
};

exports.upload = function(req, res) {
	let file = req.files.file;
	let parsedFile = path.parse(file.originalFilename);
	let timeInMilliSeconds = new Date().getTime();

	let uploadPath = config.images_base_path + "/" + parsedFile.name + "-" + timeInMilliSeconds + "-" + req.user.id + parsedFile.ext;

	console.log(uploadPath)

	mv(file.path, uploadPath, {
		clobber: true,
		mkdirp: true
	}, function(error) {
		if (error) {
			console.log('Error:::', error)
			return res.status(400).send("Failed to upload");
		} else {
			let image = config.imageUrlRewritePath.base + parsedFile.name + "-" + timeInMilliSeconds + "-" + req.user.id + parsedFile.ext;
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