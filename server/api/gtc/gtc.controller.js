'use strict';

const mv = require('mv');
const _ = require('lodash');
const path = require('path');
const sequelize = require('sequelize');
const async = require('async');
const moment = require('moment');

const service = require('../service');
const config = require('../../config/environment');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const position = require('../../config/position');
const populate = require('../../utilities/populate')
const model = require('../../sqldb/model-connect');

export async function indexOld(req, res) {
	var cart = {};
	var queryObj = {};
	var order = "desc";
	var couponQueryObj = {};
	const field = "created_on";
	const cartModelName = "Cart";
	const couponModelName = "Coupon";

	var products = [];
	var appliedProducts = [];
	var appliedCategoryProducts = [];
	var couponApplicableProducts = [];
	const productModelName = "Product";

	cart['total_items'] = 0;
	cart['marketplace_summary'] = {};
	cart['marketplace_products'] = {};
	cart['grant_total'] = 0;
	cart['discount_amount'] = 0;
	cart['grant_total_with_discounted_amount'] = 0;

	const includeArray = [{
		model: model['Product'],
		where: {
			status: status['ACTIVE']
		},
		attributes: ['id', 'product_name', 'product_slug', 'marketplace_id', 'marketplace_type_id', 'vendor_id', 'price'],
		include: [{
			model: model['Vendor'],
			attributes: ['id', 'vendor_name']
		}, {
			model: model['Category'],
			attributes: ['id', 'name']
		}, {
			model: model['SubCategory'],
			attributes: ['id', 'name', 'category_id']
		}, {
			model: model['Country'],
			attributes: ['id', 'name']
		}, {
			model: model["ProductMedia"],
			attributes: ['id', 'type', 'base_image', 'url'],
			where: {
				base_image: 1
			}
		}]
	}];

	queryObj['status'] = status['ACTIVE'];
	queryObj['user_id'] = req.user.id;

	couponQueryObj['id'] = req.query.promo_code;

	try {
		const cartResonse = await service.findAllRows(cartModelName, includeArray, queryObj, 0, null, field, order);

		if (cartResonse.count) {
			cart['total_items'] = cartResonse.count;

			const couponIncludeArray = await [{
				model: model['CouponProduct'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}, {
				model: model['CouponCategory'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}, {
				model: model['CouponExcludedProduct'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}, {
				model: model['CouponExcludedCategory'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}];

			const coupon = await service.findOneRow(couponModelName, couponQueryObj, couponIncludeArray);
			if (coupon) {
				const currentDate = moment().format('YYYY-MM-DD');
				const expiryDate = moment(coupon.expiry_date).format('YYYY-MM-DD');

				const productResponse = await service.findAllRows(productModelName, [], {
					vendor_id: coupon.vendor_id,
					status: status['ACTIVE']
				}, 0, null, 'id', 'asc');
				products = await productResponse.rows;

				if (currentDate <= expiryDate) {
					if (coupon.CouponProducts.length == 0 && coupon.CouponExcludedProducts.length > 0) {
						var couponExcludedProducts = await _.map(coupon.CouponExcludedProducts, 'product_id');
						appliedProducts = await _.filter(products, function(excludeProduct) {
							return couponExcludedProducts.indexOf(excludeProduct.id) === -1;
						});
					} else if (coupon.CouponProducts.length > 0) {
						var couponProducts = await _.map(coupon.CouponProducts, 'product_id');
						appliedProducts = await _.filter(products, function(product) {
							return couponProducts.indexOf(product.id) > -1;
						});
					} else {
						appliedProducts = await products;
					}

					if (coupon.CouponCategories.length == 0 && coupon.CouponExcludedCategories.length > 0) {
						var couponExcludedCategoryProducts = await _.map(coupon.CouponExcludedCategories, 'category_id');
						appliedCategoryProducts = await _.filter(products, function(excludeProduct) {
							return couponExcludedCategoryProducts.indexOf(excludeProduct.product_category_id) === -1;
						});
					} else if (coupon.CouponCategories.length > 0) {
						var couponCategoryProducts = await _.map(coupon.CouponCategories, 'category_id');
						appliedCategoryProducts = await _.filter(products, function(product) {
							return couponCategoryProducts.indexOf(product.product_category_id) > -1;
						});
					} else {
						appliedCategoryProducts = await products;
					}

					if (appliedProducts.length > appliedCategoryProducts.length) {
						var tmpProducts = await _.map(appliedCategoryProducts, 'id');
						couponApplicableProducts = await _.filter(appliedProducts, function(product) {
							return tmpProducts.indexOf(product.id) == -1;
						});
					} else if (appliedCategoryProducts.length > appliedProducts.length) {
						var tmpProducts = await _.map(appliedProducts, 'id');
						couponApplicableProducts = await _.filter(appliedCategoryProducts, function(product) {
							return tmpProducts.indexOf(product.id) == -1;
						});
					} else {
						var tmpProducts = await _.map(appliedCategoryProducts, 'id');
						couponApplicableProducts = await _.filter(appliedProducts, function(product) {
							return tmpProducts.indexOf(product.id) == -1;
						});
					}
				}
			}

			const marketplaceResponse = await model['Marketplace'].findAll({
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'name', 'code', 'status']
			});
			const marketplace = await JSON.parse(JSON.stringify(marketplaceResponse));

			await Promise.all(cartResonse.rows.map((aCart) => {
				aCart['total_price'] = aCart.Product.price * aCart.quantity;
				const index = marketplace.findIndex((obj) => obj.id == aCart.Product.marketplace_id);
				const existsMarketplace = cart['marketplace_products'].hasOwnProperty(marketplace[index].id);
				if (!existsMarketplace) {
					cart['marketplace_summary'][marketplace[index].id] = {};
					cart['marketplace_products'][marketplace[index].id] = {};

					cart['marketplace_summary'][marketplace[index].id].sub_total = 0;
					cart['marketplace_summary'][marketplace[index].id].shipping_ground = 0;
					cart['marketplace_summary'][marketplace[index].id].total = 0;

					cart['marketplace_products'][marketplace[index].id].count = 0;
					cart['marketplace_products'][marketplace[index].id].products = [];
				}

				cart['marketplace_summary'][aCart.Product.marketplace_id].sub_total += aCart.total_price;
				cart['marketplace_summary'][aCart.Product.marketplace_id].total = cart['marketplace_summary'][aCart.Product.marketplace_id].sub_total + cart['marketplace_summary'][aCart.Product.marketplace_id].shipping_ground;

				cart['marketplace_products'][aCart.Product.marketplace_id].count += 1;
				cart['marketplace_products'][aCart.Product.marketplace_id].products.push(aCart);

				const discountProduct = couponApplicableProducts.find((obj) => obj.id == aCart.Product.id);
				if (discountProduct && cart['discount_amount'] == 0) {
					if (coupon.discount_type == 1) {
						cart['discount_amount'] = ((discountProduct.price / 100) * coupon.discount_value).toFixed(2);
					} else if (coupon.discount_type == 2 && discountProduct.price > coupon.discount_value) {
						cart['discount_amount'] = discountProduct.price - coupon.discount_value;
					}
				}
			}));

			await Promise.all(Object.keys(cart['marketplace_summary']).map(async (key) => {
				if (cart['marketplace_summary'].hasOwnProperty(key)) {
					cart['grant_total'] += await cart['marketplace_summary'][key].total;
				}
			}));
			cart['grant_total_with_discounted_amount'] = (cart['grant_total'] - cart['discount_amount']).toFixed(2);
		}
		return res.status(200).send(cart);
	} catch (error) {
		console.log("index Error :::", error);
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