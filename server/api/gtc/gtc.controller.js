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

export async function indexExample(req, res) {
	const orderItemModelName = "OrdersItemsNew";

	try {
		const response = await model[orderItemModelName].findAll({
			where: {
				'$or': [{
					order_item_status: orderItemStatus['CANCELED'],
					cancelled_on: {
						$gte: moment().subtract(config.payment.cancelOrderItem, 'days').startOf('day').utc().toDate(),
						$lte: moment().subtract(config.payment.cancelOrderItem, 'days').endOf('day').utc().toDate()
					}
				}, {
					order_item_status: orderItemStatus['VENDOR_CANCELED'],
					cancelled_on: {
						$gte: moment().subtract(config.payment.cancelOrderItem, 'days').startOf('day').utc().toDate(),
						$lte: moment().subtract(config.payment.cancelOrderItem, 'days').endOf('day').utc().toDate()
					}
				}, {
					order_item_status: orderItemStatus['RETURN_RECIVED'],
					return_received_on: {
						$gte: moment().subtract(config.payment.returnOrderItem, 'days').startOf('day').utc().toDate(),
						$lte: moment().subtract(config.payment.cancelOrderItem, 'days').endOf('day').utc().toDate()
					}
				}],
				'$OrderItemPayouts.order_item_id$': null
			},
			include: [{
				model: model['OrdersNew'],
				attributes: ['id', 'user_id', 'payment_id', 'status'],
				include: [{
					model: model['Payment'],
					attributes: ['id', 'date', 'amount', 'payment_response']
				}]
			}, {
				model: model['OrderItemPayout'],
				attributes: []
			}]
		});
		const cancelItems = JSON.parse(JSON.stringify(response));
		await Promise.all(cancelItems.map(async (item) => {
			const refundAmt = item.price;
			const chargedPaymentRes = JSON.parse(item.OrdersNew.Payment.payment_response);
			const refundResponse = await stripe.refundCustomerCard(chargedPaymentRes.id, refundAmt);

			const newPayment = await service.createRow('Payment', {
				date: new Date(refundResponse.created),
				amount: refundResponse.amount / 100.0,
				payment_method: paymentMethod['STRIPE'],
				status: status['ACTIVE'],
				payment_response: JSON.stringify(refundResponse),
				created_by: "Administrator",
				created_on: new Date()
			});

			const orderItemPayout = await service.createRow('OrderItemPayout', {
				order_item_id: item.id,
				payment_id: newPayment.id,
				status: status['ACTIVE'],
				created_by: "Administrator",
				created_on: new Date()
			});
		}));
		return res.status(200).send("Success");
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
								res.status(200).send('Deleted Successfully');
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