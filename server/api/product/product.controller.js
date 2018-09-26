'use strict';

const fs = require('fs');
const path = require('path');
const async = require('async');
const moment = require('moment');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const request = require('request');
const parser = require('xml2json');
const WooCommerceAPI = require('woocommerce-api');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const productService = require('./product.service');
const marketplace = require('../../config/marketplace.js');
const marketplaceType = require('../../config/marketplace_type.js');
const planPermissions = require('../../config/plan-marketplace-permission.js');
const status = require('../../config/status');
const roles = require('../../config/roles');
const mws = require('mws-advanced');
const _ = require('lodash');
const stripe = require('../../payment/stripe.payment');
const paymentMethod = require('../../config/payment-method');

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
		});
}

export function productReviews(req, res) {
	var queryObj = {};
	var productID = req.params.id;
	var offset, limit, field, order;

	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "created_on";
	delete req.query.field;
	order = req.query.order ? req.query.order : "DESC";
	delete req.query.order;

	queryObj['status'] = status['ACTIVE'];
	queryObj['product_id'] = productID;

	productService.productReviews(queryObj, offset, limit, field, order)
		.then((productReviews) => {
			return res.status(200).send(productReviews);
		})
		.catch((error) => {
			console.log("Error:::", error);
			return res.status(500).send("Internal server error.");
		});
}

export function productRatingsCount(req, res) {
	var productID = req.params.id;

	productService.productRatingsCount(productID)
		.then((productRatings) => {
			return res.status(200).send(productRatings);
		})
		.catch((error) => {
			console.log("Error:::", error);
			return res.status(500).send("Internal server error.");
		});
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
	var perPageLimit = 36;
	var maximumProductLimit = 0;
	var queryObjProduct = {};
	var queryObjPlanLimit = {};
	var productModelName = "Product";
	var planLimitModelName = "PlanLimit";
	var agenda = require('../../app').get('agenda');

	req.checkBody('vendor_id', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	(async () => {
		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox']
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
				if (products.length > 0) {
					if (req.user.role === roles['VENDOR']) {
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
						return service.findOneRow(planLimitModelName, queryObjPlanLimit)
							.then((planLimit) => {
								if (planLimit) {
									maximumProductLimit = planLimit.maximum_product;
									return service.countRows(productModelName, queryObjProduct)
								} else {
									return res.status(404).send("plan limit not found.");
								}
							})
							.then(async (existingProductCount) => {
								var remainingProductLength = maximumProductLimit - existingProductCount;
								if (products.length <= remainingProductLength) {
									agenda.now(config.jobs.aliExpressScrape, {
										products: products,
										user: req.user
									});
									await browser.close();
									return res.status(200).send("We started importing products from AliExpress. Please check it few minutes later.");
								} else {
									return res.status(403).send("Limit exceeded to add product.");
								}
							})
							.catch((error) => {
								console.log("Error:::", error);
								return res.status(500).send("Internal server error");
							});
					} else {
						return res.status(403).send("Forbidden");
					}
				} else {
					return res.status(404).send("products not found.");
				}
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

function getEbayToken(params) {
	return new Promise(function(resolve, reject) {
		var authCode = new Buffer(config.ebay.clientId + ":" + config.ebay.clientSecret).toString('base64');
		request.post({
			url: config.ebay.authURL,
			form: params,
			headers: {
				"Authorization": "Basic " + authCode,
				"content-type": 'application/x-www-form-urlencoded'
			}
		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				resolve(JSON.parse(body));
			} else {
				reject(error);
			}
		});
	});
}

function getEbaySellerItems(ebayObject) {
	return new Promise(function(resolve, reject) {
		var options = {
			method: 'POST',
			url: config.ebay.sellerListURL,
			headers: {
				'X-EBAY-API-SITEID': 0,
				'X-EBAY-API-COMPATIBILITY-LEVEL': 967,
				'X-EBAY-API-CALL-NAME': "GetSellerList",
				'X-EBAY-API-IAF-TOKEN': ebayObject.accessToken
			},
			body: `<?xml version="1.0" encoding="utf-8"?>
					<GetSellerListRequest xmlns="urn:ebay:apis:eBLBaseComponents">    
						<ErrorLanguage>en_US</ErrorLanguage>
						<WarningLevel>High</WarningLevel>
					  	<GranularityLevel>Coarse</GranularityLevel>
					  	<StartTimeFrom>${ebayObject.startTimeFrom}</StartTimeFrom> 
					  	<StartTimeTo>${ebayObject.startTimeTo}</StartTimeTo> 
					  	<IncludeWatchCount>true</IncludeWatchCount> 
					  	<Pagination> 
					    	<EntriesPerPage>${config.ebay.entriesPerPage}</EntriesPerPage> 
					  	</Pagination>
					</GetSellerListRequest>`
		};
		request(options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				const parsedJSON = parser.toJson(body);
				resolve(JSON.parse(parsedJSON));
			} else {
				reject(error);
			}
		});
	});
}

export async function importEbay(req, res) {
	var params = {};
	var ebayCredentials = {};
	var queryObjProduct = {};
	var queryObjPlanLimit = {}
	var maximumProductLimit = 0;
	const productModelName = "Product";
	const planLimitModelName = "PlanLimit";
	const agenda = require('../../app').get('agenda');
	const vendorCurrentPlan = req.user.Vendor.VendorPlans[0];
	params.code = req.query.code;
	params.grant_type = 'authorization_code';
	params.redirect_uri = config.ebay.redirectUri;

	try {
		if (vendorCurrentPlan) {
			const currentDate = moment().format('YYYY-MM-DD');
			const planStartDate = moment(vendorCurrentPlan.start_date).format('YYYY-MM-DD');
			const planEndDate = moment(vendorCurrentPlan.end_date).format('YYYY-MM-DD');
			if (currentDate >= planStartDate && currentDate <= planEndDate) {
				var actionsValues = planPermissions[vendorCurrentPlan.plan_id][marketplace['PUBLIC']];
				if (actionsValues && Array.isArray(actionsValues) && actionsValues.length > 0) {
					if (getIndexOfAction(actionsValues, '*') > -1) {
						const loginResponse = await getEbayToken(params);
						ebayCredentials['accessToken'] = loginResponse.access_token;
						ebayCredentials['startTimeFrom'] = '2018-08-13T00:00:00.000Z';
						ebayCredentials['startTimeTo'] = '2018-09-07T23:59:59.999Z';
						const sellerListResponse = await getEbaySellerItems(ebayCredentials);
						const totalNumberOfEntries = await parseInt(sellerListResponse.GetSellerListResponse.PaginationResult.TotalNumberOfEntries);

						if (totalNumberOfEntries > 0) {
							if (req.user.role === roles['VENDOR']) {
								const vendorCurrentPlan = req.user.Vendor.VendorPlans[0];
								const planStartDate = moment(vendorCurrentPlan.start_date, 'YYYY-MM-DD').startOf('day').utc().format("YYYY-MM-DD HH:mm");
								const planEndDate = moment(vendorCurrentPlan.end_date, 'YYYY-MM-DD').endOf('day').utc().format("YYYY-MM-DD HH:mm");

								queryObjPlanLimit['plan_id'] = vendorCurrentPlan.plan_id;
								queryObjPlanLimit['status'] = status['ACTIVE'];

								queryObjProduct['vendor_id'] = req.user.Vendor.id;
								queryObjProduct['created_on'] = {
									'$gte': planStartDate,
									'$lte': planEndDate
								}

								const planLimit = await service.findOneRow(planLimitModelName, queryObjPlanLimit);

								if (planLimit) {
									maximumProductLimit = planLimit.maximum_product;
									const existingProductCount = await service.countRows(productModelName, queryObjProduct);
									const remainingProductLength = maximumProductLimit - existingProductCount;

									if (totalNumberOfEntries <= remainingProductLength) {
										agenda.now(config.jobs.ebayInventory, {
											ebayCredentials: ebayCredentials,
											user: req.user
										});
										return res.render('ebay-callback-close', {
											layout: false,
											ebayResponseData: "We started importing products from Ebay. Please check it few minutes later."
										});
									} else {
										return res.status(403).send("Limit exceeded to add product.");
									}
								} else {
									return res.status(404).send("plan limit not found.");
								}
							} else {
								return res.status(403).send("Forbidden");
							}
						} else {
							return res.render('ebay-callback-close', {
								layout: false,
								ebayResponseData: "404 products not found"
							});
						}
					} else {
						return res.send(403, "Forbidden");
					}
				} else {
					return res.status(403).send("Forbidden");
				}
			} else {
				return res.status(403).send("Sorry your plan expired.");
			}
		} else {
			return res.status(403).send("Forbidden");
		}
	} catch (error) {
		console.log("error", error);
		return res.status(500).send(error);
	}
}

function getIndexOfAction(array, value) {
	if (value) {
		if (array.length > 0) {
			for (var i = 0; i < array.length; i++) {
				if (array[i]) {
					if (array[i] == value) {
						return i;
					}
				}
			}
		}
		return -1;
	}
}

export function importAmazon(req, res) {
	let agenda = require('../../app').get('agenda');

	if (req.body && !req.body.amazon_auth_token)
		return res.status(400).send("Missing Amazon Auth token");
	if (req.body && !req.body.amazon_seller_id)
		return res.status(400).send("Missing Merchant Id");
	if (req.body && !req.body.amazon_marketplace)
		return res.status(400).send("Missing MarketPlace Region");

	agenda.now(config.jobs.amazonImportJob, {
		user: req.user,
		body: req.body
	});

	return res.status(200).send('Amazon Product Import started, you will receive notification when it is done');
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

export function importProduct(req, res) {
	var bodyParamsArray = [];
	for (var i = 0; i < req.body.length; i++) {
		req.body.created_on = new Date();
		req.body.created_by = req.user.Vendor.vendor_name;
		bodyParamsArray.push(req.body[i]);
	}
	var finalresults = bodyParamsArray.filter(o => Object.keys(o).length);
	req.endpoint = 'Product';
	service.createBulkRow(req.endpoint, finalresults)
		.then(function(result) {
			var productMediaArray = [];
			for (var i = 0; i < result.length; i++) {
				productMediaArray.push(result[i]);
			}
			//var product_id = result.id;
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

function resMessage(message, messageDetails) {
	return {
		message: message,
		messageDetails: messageDetails
	};
}

export function addProduct(req, res) {

	var product_id;

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

	if (req.query.status) {
		var productStatus = req.query.status;
		delete req.query.status;
		req.query.status = status[productStatus]
	}

	req.query.publish_date = new Date();
	req.query.product_slug = string_to_slug(req.query.product_name);
	req.query.created_on = new Date();
	req.query.created_by = req.user.Vendor.vendor_name;

	service.createRow('Product', req.query)
		.then(function(row) {
			product_id = row.id;

			if (req.body.imageArr) {
				var imagePromise = []; 
				var imageArr = JSON.parse(req.body.imageArr);
				imagePromise.push(updateProductMedia(imageArr, product_id));
				return Promise.all(imagePromise);
			}
		}).then(function(updatedImage){

			if (req.body.attributeArr) {
				var attributePromise = []; 
				var attributeArr = JSON.parse(req.body.attributeArr);
				attributePromise.push(updateProductAttribute(attributeArr, product_id));
				return Promise.all(attributePromise);
			}
		}).then(function(updatedAttribute){

			if (req.body.discountArr) {
				var discountPromise = [];
				var discountArr = JSON.parse(req.body.discountArr);
				discountPromise.push(updateDiscount(discountArr, product_id));
				return Promise.all(discountPromise);
			}
		}).then(function(updatedDiscount){
			return res.status(200).send("Created Successfully");

		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		})
}

export function editProduct(req, res) {

	var product_id = req.query.product_id;

	if (req.query.status) {
		var productStatus = req.query.status;
		delete req.query.status;
		req.query.status = status[productStatus]
	}

	req.query.product_slug = string_to_slug(req.query.product_name);
	req.query.last_updated_on = new Date();
	req.query.last_updated_by = req.user.Vendor.vendor_name;

	var bodyParams = req.query;

	model["Product"].update(bodyParams, {
		where: {
			id: product_id
		}
	}).then(function(row) {
			if (req.body.imageArr) {
				var imagePromise = []; 
				var imageArr = JSON.parse(req.body.imageArr);
				imagePromise.push(updateProductMedia(imageArr, product_id));
				return Promise.all(imagePromise);
			}
		
	}).then(function(){
		if (req.body.attributeArr) {

			var attributePromise = []; 
			var attributeArr = JSON.parse(req.body.attributeArr);
			attributePromise.push(updateProductAttribute(attributeArr, product_id));
			return Promise.all(attributePromise);
		}
	}).then(function(updatedAttribute){
		if (req.body.discountArr) {

			var discountPromise = [];
			var discountArr = JSON.parse(req.body.discountArr);
			discountPromise.push(updateDiscount(discountArr, product_id));
			return Promise.all(discountPromise);
		}

	}).then(function(updatedDiscount){
		return res.status(200).send("Updated Successfully");

	}).catch(function(error) {
		console.log('Error:::', error);
		res.status(500).send("Internal server error");
		return;
	})
}

function updateProductMedia(imageArr, product_id) {

	var queryObj = {
		product_id: product_id
	}

	model['ProductMedia'].destroy({
		where: queryObj
	}).then(function(delectedProductMedia) {

		var mediaCreatePromise = [];
		
		_.forOwn(imageArr, function(imageElement) {

			imageElement.product_id = product_id;
			imageElement.created_on = new Date();

			mediaCreatePromise.push(createProductMedia(imageElement));
		})
		return Promise.all(mediaCreatePromise);
	
	}).then(function(response){
		return Promise.resolve(response);
	
	}).catch(function(error){
		console.log("Error::",error);
		return Promise.reject(error);
	})
}

function updateProductAttribute(attributeArr, product_id){

	var queryObj = {
		product_id: product_id
	}

	model['ProductAttribute'].destroy({
		where: queryObj
	}).then(function(delectedAttributerow) {
		  var attributeCreatePromise = [];
		
		_.forOwn(attributeArr, function(attributeElement) {
			attributeElement.product_id = product_id;
			attributeElement.attribute_id = attributeElement.name;
			attributeElement.status = 1;
			delete attributeElement.name;

			attributeCreatePromise.push(createProductAttribute(attributeElement));
		});

		return Promise.all(attributeCreatePromise);

	}).then(function(response){
		return Promise.resolve(response);

	}).catch(function(error){
		console.log("Error::",error);
		return Promise.reject(error);
	})
}

function updateDiscount(discountArr, product_id){
	var queryObj = {
		product_id: product_id
	}

	model['Discount'].destroy({
		where: queryObj
	}).then(function(delectedDiscountrow) {
		var discountCreatePromise = [];

		_.forOwn(discountArr, function(discountElement) {

			discountElement.product_id = product_id;
			discountElement.created_on = new Date();

			discountCreatePromise.push(createDiscount(discountElement));
		});
		return Promise.all(discountCreatePromise);

	}).then(function(response){
		return Promise.resolve(response);

	}).catch(function(error){
		console.log("Error::",error);
		return Promise.reject(error);
	})
}

function createProductMedia(imageElement) {
	return service.createRow('ProductMedia', imageElement);
}

function createProductAttribute(attributeElement) {
	return service.createRow('ProductAttribute', attributeElement);
}

function createDiscount(discountElement, product_id) {
	return service.createRow('Discount', discountElement);
}

export function featureProductPayment(req,res){
	
	service.findIdRow('PaymentSetting',req.body.payment_details,[])
		.then(function(cardDetails){

		   return stripe.chargeCustomerCard(cardDetails.stripe_customer_id, cardDetails.stripe_card_id, 
											req.body.feature_amount, 'Payment for Featuring Product', 'usd');
		}).then(function(paymentDetails){
			
			if(paymentDetails.paid) {

				var paymentObj={
					paid_date:  new Date(paymentDetails.created),
					paid_amount: paymentDetails.amount / 100.0,
                    payment_method: paymentMethod['STRIPE'],
                    status: status['ACTIVE'],
					payment_response: JSON.stringify(paymentDetails),
					created_by: req.user.Vendor.vendor_name,
					created_on: new Date()
				}
				service.createRow('Payment', paymentObj)
					.then(function(paymentRow){

						


					}).catch(function(error){
						console.log("Error:::",error);
					})
			}else{
				return res.status(500).send({
                    "message": "ERROR",
                    "messageDetails": "Featuring Product UnSuccessfull with Payment Error"
                });
			}
		}).catch(function(error){
			return res.status(500).send({
				"message": "ERROR",
				"messageDetails": "Featuring Product UnSuccessfull with Error",
				"errorDescription": error
			});
		})
}