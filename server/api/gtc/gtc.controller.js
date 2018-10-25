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
const reportsService = require('../reports/reports.service');
const sendEmail = require('../../agenda/send-email');
const config = require('../../config/environment');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const position = require('../../config/position');
const populate = require('../../utilities/populate')
const model = require('../../sqldb/model-connect');

export async function indexExample(req, res) {
	const orderID = 20;
	const orderModelName = "OrdersNew";
	var emailTemplateModel = 'EmailTemplate';
	const vendorOrderModelName = "VendorOrder";
	const orderItemModelName = "OrdersItemsNew";

	const includeOrderArray = [{
		model: model['User'],
		attributes: ['id', 'first_name', 'last_name', 'user_contact_email', 'email_verified']
	}, {
		model: model['Address'],
		as: 'shippingAddress1',
		attributes: ['id', 'first_name', 'last_name', 'company_name', 'address_line1', 'address_line2', 'city', 'postal_code'],
		include: [{
			model: model['State'],
			attributes: ['id', 'name']
		}, {
			model: model['Country'],
			attributes: ['id', 'name']
		}]
	}, {
		model: model[orderItemModelName],
		attributes: ['id', 'order_id', 'product_id', 'quantity', 'price'],
		include: [{
			model: model['Product'],
			attributes: ['id', 'product_name'],
			include: [{
				model: model['ProductMedia'],
				where: {
					status: status['ACTIVE'],
					base_image: 1
				},
				attributes: ['id', 'product_id', 'type', 'url', 'base_image'],
				required: false
			}]
		}]
	}];

	try {
		const userOrderEmailTemplate = await service.findOneRow("EmailTemplate", {
			name: "GTC-ORDER-DETAIL-NEW"
		});

		const vendorOrderEmailTemplate = await service.findOneRow("EmailTemplate", {
			name: "GTC-VENDOR-ORDER-DETAIL"
		});

		const userOrderResponse = await service.findOneRow(orderModelName, {
			id: orderID
		}, includeOrderArray);

		const vendorOrderResponse = await model[vendorOrderModelName].findAll({
			where: {
				order_id: orderID,
				vendor_id: {
					$col: 'OrdersNew->OrdersItemsNews->Product.vendor_id'
				}
			},
			attributes: ['id', 'order_id', 'vendor_id', 'status'],
			include: [{
				model: model['Vendor'],
				attributes: ['id', 'vendor_name', 'contact_email']
			}, {
				model: model['OrdersNew'],
				attributes: ['id', 'ordered_date'],
				include: [{
					model: model['Address'],
					as: 'shippingAddress1',
					attributes: ['id', 'first_name', 'last_name', 'company_name', 'address_line1', 'address_line2', 'city', 'postal_code'],
					include: [{
						model: model['State'],
						attributes: ['id', 'name']
					}, {
						model: model['Country'],
						attributes: ['id', 'name']
					}]
				}, {
					model: model['OrdersItemsNew'],
					attributes: ['id', 'order_id', 'product_id', 'quantity', 'price', 'shipping_cost', 'gtc_fees', 'plan_fees', 'final_price'],
					include: [{
						model: model['Product'],
						attributes: ['id', 'product_name', 'vendor_id'],
						include: [{
							model: model['ProductMedia'],
							where: {
								status: status['ACTIVE'],
								base_image: 1
							},
							attributes: ['id', 'product_id', 'type', 'url', 'base_image'],
							required: false
						}]
					}]
				}]
			}]
		});
		var vendorOrders = await JSON.parse(JSON.stringify(vendorOrderResponse));

		var userOrderSubject = userOrderEmailTemplate.subject;
		var userOrderTemplate = Handlebars.compile(userOrderEmailTemplate.body);
		userOrderResponse.ordered_date = moment(userOrderResponse.ordered_date).format('MMM D, Y');
		var userOrderResult = userOrderTemplate(userOrderResponse);


		await Promise.all(vendorOrders.map(async (vendorOrder, i) => {
			vendorOrders[i].OrdersNew.total_price = await _.sumBy(vendorOrder.OrdersNew.OrdersItemsNews, function(o) {
				return parseFloat(o.final_price);
			});
			var vendorOrderSubject = vendorOrderEmailTemplate.subject;
			var vendorOrderTemplate = Handlebars.compile(vendorOrderEmailTemplate.body);
			vendorOrder.OrdersNew.ordered_date = moment(vendorOrder.OrdersNew.ordered_date).format('MMM D, Y');
			var vendorOrderResult = vendorOrderTemplate(vendorOrder.OrdersNew);
			if (vendorOrder.Vendor.contact_email) {
				await sendEmail({
					to: vendorOrder.Vendor.contact_email,
					subject: vendorOrderSubject,
					html: vendorOrderResult
				});
			}
		}));

		if (userOrderResponse.User.email_verified && userOrderResponse.User.user_contact_email) {
			await sendEmail({
				to: userOrderResponse.User.user_contact_email,
				subject: userOrderSubject,
				html: userOrderResult
			});
		}
		return res.status(200).send(vendorOrders);
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