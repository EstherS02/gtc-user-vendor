'use strict';

const fs = require('fs');
const path = require('path');
const async = require('async');
const moment = require('moment');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const request = require('request');
const AliexScrape = require('aliexscrape');
const WooCommerceAPI = require('woocommerce-api');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const productService = require('./product.service');
const marketplace = require('../../config/marketplace.js');
const marketplaceType = require('../../config/marketplace_type.js');
const status = require('../../config/status');
const roles = require('../../config/roles');

export function productView(req, res) {
	var productID = req.params.id;

	productService.productView(productID)
		.then((product) => {
			if (product) {
				return res.status(200).send(product);
			} else {
				return res.status(404).send("Product not found.");
			}
		})
		.catch((error) => {
			console.log("Error:::", error);
			return res.status(500).send("Internal server error.");
		})
}

export function featureMany(req, res) {
	const ids = req.body.ids;
	console.log("requestedIds", ids.length);
	var arr = [];
	for (var i = 0; i <= ids.length - 1; i++) {
		var obj = {};
		obj['product_id'] = ids[i];
		obj['status'] = 1;
		obj['start_date'] = new Date();
		obj['created_on'] = new Date();
		arr.push(obj);
	}
	model["FeaturedProduct"].bulkCreate(arr, {
			ignoreDuplicates: true
		})
		.then(function(row) {
			res.status(201).send("Created");
			return;
		}).catch(function(error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}

export function create(req, res) {
	var bodyParams = {};
	var productModelName = "Product";

	req.checkBody('product_name', 'Missing Query Param').notEmpty();
	req.checkBody('sku', 'Missing Query Param').notEmpty();
	req.checkBody('marketplace_id', 'Missing Query Param').notEmpty();
	req.checkBody('product_category_id', 'Missing Query Param').notEmpty();
	req.checkBody('sub_category_id', 'Missing Query Param').notEmpty();
	req.checkBody('product_location', 'Missing Query Param').notEmpty();
	req.checkBody('state_id', 'Missing Query Param').notEmpty();
	req.checkBody('city', 'Missing Query Param').notEmpty();


	if (req.user.role === roles['ADMIN']) {
		req.checkBody('vendor_id', 'Missing Query Param').notEmpty();
	}
	if (req.body.marketplace_id === marketplace['WHOLESALE']) {
		req.checkBody('marketplace_type_id', 'Missing Query Param').notEmpty();
		req.checkBody('moq', 'Missing Query Param').notEmpty();
	}

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	bodyParams = req.body;
	if (req.user.role === roles['VENDOR']) {
		bodyParams['vendor_id'] = req.user.Vendor.id;
	}
	if (bodyParams['marketplace_id'] == marketplace['WHOLESALE']) {
		if (Object.values(marketplaceType).indexOf(bodyParams['marketplace_type_id']) == -1) {
			return res.status(404).send("Marketplace Type not found");
		}
	} else {
		delete bodyParams['marketplace_type_id'];
		delete bodyParams['moq'];
	}
	bodyParams['product_slug'] = string_to_slug(req.body.product_name);
	bodyParams['quantity_available'] = req.body.sku;
	bodyParams['status'] = status['ACTIVE'];
	bodyParams['publish_date'] = new Date();
	bodyParams['created_on'] = new Date();

	service.createRow(productModelName, bodyParams)
		.then(function(product) {
			return res.status(201).send(product);
		})
		.catch(function(error) {
			console.log('Error:::', error);
			return res.status(500).send("Internal server error.");
		})
}

export function importAliExpress(req, res) {

	var products = [];
	var parsedProducts = [];
	var perPageLimit = 36;
	var aliExpressProducts = [];
	var importAliExpress = [];
	var maximumProductLimit = 0;
	var queryObjProduct = {};
	var queryObjPlanLimit = {};
	var productModelName = "Product";
	var planLimitModelName = "PlanLimit";

	req.checkBody('vendor_id', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}


	(async () => {
		const browser = await puppeteer.launch({
			headless: true
		});

		const loginPage = await browser.newPage();

		await loginPage.goto('https://login.aliexpress.com/buyer.htm', {
			timeout: 80000
		});

		var frames = await loginPage.frames();

		var loginFrame = frames.find((frame) => frame.url().indexOf("passport.aliexpress.com") > 0);

		const loginId = await loginFrame.$("#fm-login-id");
		await loginId.type(config.aliExpressLoginId);

		const loginPassword = await loginFrame.$("#fm-login-password");
		await loginPassword.type(config.aliExpressLoginPassword);

		await loginPage.keyboard.press('Enter');

		const vendorProductListPage = await browser.newPage();

		callAliExpressMethod(0);

		async function callAliExpressMethod(pageCount) {
			pageCount += 1;

			var store_url = "https://www.aliexpress.com/store/" + req.body.vendor_id + "/search/" + pageCount + ".html";
			await vendorProductListPage.goto(store_url);
			var content = await vendorProductListPage.content();
			var $ = cheerio.load(content);
			const listItems = $('.ui-box-body');

			if ($(listItems).find('ul.items-list.util-clearfix').children().length < perPageLimit) {
				await $(listItems).find('ul.items-list.util-clearfix').children().each((i, child) => {
					var productLink = $(child).find('a.pic-rind').attr('href');
					var productId = productLink.split(/[\s/]+/).pop().slice(0, -5).split('_')[1];
					products.push(productId);
				});
				await browser.close();
				if (products.length > 0) {
					for (let i = 0; i < products.length; i++) {
						aliExpressProducts.push(getAliExpressProducts(products[i]));
					}
				} else {
					return res.status(404).send("products not found.");
				}
				return Promise.all(aliExpressProducts)
					.then((results) => {
						parsedProducts = results;
						if (req.user.role === roles['ADMIN']) {

						} else if (req.user.role === roles['VENDOR']) {
							var vendorCurrentPlan = req.user.Vendor.VendorPlans[0];
							var planStartDate = moment(vendorCurrentPlan.start_date, 'YYYY-MM-DD').startOf('day').utc().format("YYYY-MM-DD HH:mm");
							var planEndDate = moment(vendorCurrentPlan.end_date, 'YYYY-MM-DD').endOf('day').utc().format("YYYY-MM-DD HH:mm");

							queryObjPlanLimit['plan_id'] = vendorCurrentPlan.plan_id;
							queryObjPlanLimit['status'] = status['ACTIVE'];

							queryObjProduct['vendor_id'] = req.user.Vendor.id;
							queryObjProduct['created_on'] = {
								'$gte': planStartDate,
								'$lte': planEndDate
							}
							return service.findOneRow(planLimitModelName, queryObjPlanLimit);
						} else {
							return res.status(403).send("Forbidden");
						}
					})
					.then((planLimit) => {
						if (planLimit) {
							maximumProductLimit = planLimit.maximum_product;
							return service.countRows(productModelName, queryObjProduct)
						} else {
							return res.status(404).send("plan limit not found.");
						}
					})
					.then((existingProductCount) => {
						var remainingProductLength = maximumProductLimit - existingProductCount;
						if (parsedProducts.length <= remainingProductLength) {
							for (var i = 0; i < parsedProducts.length; i++) {
								importAliExpress.push(productService.importAliExpressProducts(parsedProducts[i], req));
							}
							return Promise.all(importAliExpress);
						} else {
							return res.status(403).send("Limit exceeded to add product.");
						}
					})
					.then((response) => {
						return res.status(200).send("Imported successfully.");
					})
					.catch((error) => {
						console.log("Error:::", error);
						return res.status(500).send("Internal server error");
					});
			} else {
				await $(listItems).find('ul.items-list.util-clearfix').children().each((i, child) => {
					var productLink = $(child).find('a.pic-rind').attr('href');
					var productId = productLink.split(/[\s/]+/).pop().slice(0, -5).split('_')[1];
					products.push(productId);
				});
				callAliExpressMethod(pageCount);
			}
		}
	})();
}

function getAliExpressProducts(productId) {
	return new Promise(function(resolve, reject) {
		AliexScrape(productId)
			.then((response) => {
				var parsedJSON = JSON.parse(response);
				resolve(parsedJSON);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

export function importWoocommerce(req, res) {

	req.checkBody('store_url', 'Missing Query Param').notEmpty();
	req.checkBody('consumer_key', 'Missing Query Param').notEmpty();
	req.checkBody('consumer_secret', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	const limit = config.wooCommercePerPageLimit;

	var WooCommerce = new WooCommerceAPI({
		url: req.body.store_url,
		consumerKey: req.body.consumer_key,
		consumerSecret: req.body.consumer_secret,
		wpAPI: true,
		version: 'wc/v2'
	});

	getWooCommerceProducts(limit, WooCommerce)
		.then((allProducts) => {
			if (allProducts.length != 0) {
				if (req.user.role === roles['ADMIN']) {

				} else if (req.user.role === roles['VENDOR']) {
					var queryObjProduct = {};
					var queryObjPlanLimit = {};
					var productModelName = "Product";
					var planLimitModelName = "PlanLimit";
					var vendorCurrentPlan = req.user.Vendor.VendorPlans[0];
					var planStartDate = moment(vendorCurrentPlan.start_date, 'YYYY-MM-DD').startOf('day').utc().format("YYYY-MM-DD HH:mm");
					var planEndDate = moment(vendorCurrentPlan.end_date, 'YYYY-MM-DD').endOf('day').utc().format("YYYY-MM-DD HH:mm");

					queryObjPlanLimit['plan_id'] = vendorCurrentPlan.plan_id;
					queryObjPlanLimit['status'] = status['ACTIVE'];

					queryObjProduct['vendor_id'] = req.user.Vendor.id;
					queryObjProduct['created_on'] = {
						'$gte': planStartDate,
						'$lte': planEndDate
					}

					service.findOneRow(planLimitModelName, queryObjPlanLimit)
						.then(function(planLimit) {
							if (planLimit) {
								const maximumProductLimit = planLimit.maximum_product;
								service.countRows(productModelName, queryObjProduct)
									.then(function(existingProductCount) {
										var remainingProductLength = maximumProductLimit - existingProductCount;
										if (allProducts.length <= remainingProductLength) {
											var skippedProduct = 0;
											var successProduct = 0;
											async.eachSeries(allProducts, function iterater(product, callback) {
												productService.importWooCommerceProducts(product, req)
													.then((result) => {
														successProduct += 1;
														callback(null, result);
													})
													.catch(function(error) {
														skippedProduct += 1;
														callback(null, error);
													});
											}, function done() {
												var responseObj = {};
												responseObj['skippedProduct'] = skippedProduct;
												responseObj['successProduct'] = successProduct;
												return res.status(200).send(responseObj);
											});
										} else {
											return res.status(403).send("Limit exceeded to add product.");
										}
									}).catch(function(error) {
										console.log("Error::::", error);
										return res.status(500).send('Internal server error.');
									});
							}
						})
						.catch(function(error) {
							console.log("Error::::", error);
							return res.status(500).send('Internal server error.');
						});
				} else {
					return res.status(403).send('Forbidden');
				}
			} else {
				return res.status(404).send('Products not found.');
			}
		}).catch(function(error) {
			console.log("Error::::", error);
			return res.status(400).send(error);
		});
}

function getWooCommerceProducts(perPageLimit, WooCommerce) {
	var products = [];
	return new Promise(function(resolve, reject) {
		callWooCommerceMethod(0);

		function callWooCommerceMethod(pageCount) {
			pageCount += 1;
			WooCommerce.get('products?per_page=' + perPageLimit + '&page=' + pageCount, function(error, data, response) {
				var resp = JSON.parse(response);
				if (Array.isArray(resp)) {
					if (resp.length < perPageLimit) {
						products = products.concat(resp);
						resolve(products);
					} else {
						products = products.concat(resp);
						callWooCommerceMethod(pageCount);
					}
				} else if (resp.code == 'woocommerce_rest_authentication_error') {
					reject("Invalid signature - provided signature does not match.");
				} else {
					reject(error);
				}
			});
		}
	});
}

export function featureOne(req, res) {
	model["Product"].findById(req.params.id)
		.then(function(row) {
			if (row) {
				var obj = {};
				obj['product_id'] = row.id;
				obj['status'] = 1;
				obj['start_date'] = new Date();
				obj['created_on'] = new Date();
				model["FeaturedProduct"].upsert(obj)
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
			} else {
				res.status(404).send("Not found");
				return;
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		});
}

export function addProduct(req, res) {

	if (req.query.marketplace == 'Private Wholesale Marketplace')
		req.query.marketplace_id = marketplace.WHOLESALE;

	if (req.query.marketplace == 'Public Marketplace')
		req.query.marketplace_id = marketplace.PUBLIC;

	if (req.query.marketplace == 'Services Marketplace')
		req.query.marketplace_id = marketplace.SERVICE;

	if (req.query.marketplace == 'Lifestyle Marketplace')
		req.query.marketplace_id = marketplace.LIFESTYLE;

	delete req.query.marketplace;

	if (req.user.role === roles['VENDOR']) {
		req.query.vendor_id = req.user.Vendor.id;
	}
	req.query.status = status['ACTIVE'];
	req.query.publish_date = new Date();
	req.query.product_slug = string_to_slug(req.query.product_name);
	req.query.created_on = new Date();
	req.query.created_by = req.user.Vendor.vendor_name;

	service.createRow('Product', req.query)
		.then(function(row) {
			var product_id = row.id;

			if (req.body.data) {
				var arrayEle = JSON.parse(req.body.data);
				updateProductMedia(arrayEle, product_id);
			}

			if (req.body.attributeArr) {
				var attributeEle = JSON.parse(req.body.attributeArr);
				updateProductAttribute(attributeEle, product_id);
			}
			return res.status(200).send(row);
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		})
}

function updateProductMedia(arrayEle, product_id) {
	arrayEle.forEach(function(element) {
		element.product_id = product_id;
		console.log(element);

		service.createRow('ProductMedia', element)
			.then(function(result) {
				return;
			})
	});
}

function updateProductAttribute(attributeEle, product_id) {
	var i = 0;
	async.mapSeries(attributeEle, function(attributeElement, callback) {

		attributeElement.product_id = product_id;
		attributeElement.attribute_id = attributeEle[i].name;
		attributeElement.status = 1;
		delete attributeElement.name;

		service.createRow('ProductAttribute', attributeElement)
			.then(function(result) {
				return callback(null, result);
			})
			.catch(function(error) {
				console.log('Error:::', error);
				return callback(null);
			});
		i++;
	}, function(err, results) {
		return;
	});
}

export function editProduct(req, res) {

	var id = req.query.product_id;

	var stat = req.body.status;
	delete req.body.status;

	req.body.status = status[stat];
	var bodyParams = req.body;

	model["Product"].update(bodyParams, {
		where: {
			id: id
		}
	}).then(function(row) {
		if (row) {
			res.status(200).send("Created");
		} else {
			res.status(500).send("Internal server error");
		}
	}).catch(function(error) {
		res.status(500).send(error);
	})
}

export function discount(req, res) {
	var arrayEle = JSON.parse(req.body.data);
	arrayEle.forEach(function(element) {

		service.createRow('Discount', element)
			.then(function(discount) {
				return res.status(201).send(discount);
			})
			.catch(function(error) {
				console.log('Error:::', error);
				return res.status(500).send("Internal server error.");
			})
	});
}

function string_to_slug(str) {
	str = str.replace(/^\s+|\s+$/g, ''); // trim
	str = str.toLowerCase();

	// remove accents, swap ñ for n, etc
	var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
	var to = "aaaaeeeeiiiioooouuuunc------";
	for (var i = 0, l = from.length; i < l; i++) {
		str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
	}

	str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
		.replace(/\s+/g, '-') // collapse whitespace and replace by -
		.replace(/-+/g, '-'); // collapse dashes

	return str;
}