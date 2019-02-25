'use strict';

const fs = require('fs');
const mv = require('mv');
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
const populate = require('../../utilities/populate');
const mws = require('mws-advanced');
const _ = require('lodash');
const stripe = require('../../payment/stripe.payment');
const paymentMethod = require('../../config/payment-method');
const durationUnitCode = require('../../config/duration-unit');

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

export async function create(req, res) {
	
	var bodyParams = {};
	var productMediaPromises = [];
	var productAttributes = [];
	var ProductAttributePromises = [];
	var productModelName = "Product";
	var productMediaModelName = "ProductMedia";
	var productAttributeModelName = "ProductAttribute";

	if (_.isEmpty(req.files)) {
		return res.status(400).send("Minimum one product image required.");
	} else {
		if (!req.files.product_base_image) {
			return res.status(400).send("Product base image required.");
		}
	}

	req.checkBody('sku', 'Stock keeping unit required').notEmpty();
	req.checkBody('product_name', 'Product name required').notEmpty();
	req.checkBody('status', 'Product status required').notEmpty();
	req.checkBody('marketplace_id', 'Product marketplace required').notEmpty();
	req.checkBody('product_category_id', 'Product category required').notEmpty();
	req.checkBody('sub_category_id', 'Product sub category required').notEmpty();
	req.checkBody('product_location', 'Product country required').notEmpty();
	req.checkBody('state_id', 'Product state required').notEmpty();
	req.checkBody('city', 'Product city required').notEmpty();
	req.checkBody('quantity_available', 'Product available quantity required').notEmpty();
	// Price not required for WTB,WTT,RFQ 
	//req.checkBody('price', 'Missing Query Param').notEmpty();
	req.checkBody('exclusive_sale', 'Missing Query Param').notEmpty();

	if (req.body.marketplace_id == marketplace['WHOLESALE']) {
		req.checkBody('marketplace_type_id', 'Product Type required').notEmpty();
		req.checkBody('moq', 'Minimum order quantity required').notEmpty();
	} else {
		delete req.body.moq;
		delete req.body.marketplace_type_id;
	}
	if (req.body.exclusive_sale == 1) {
		req.checkBody('exclusive_start_date', 'Offer start date required').notEmpty();
		req.checkBody('exclusive_end_date', 'Offer end date required').notEmpty();
		req.checkBody('exclusive_offer', 'Offer percentage required').notEmpty().isInt({
			gt: 0
		});

		const startDate = new Date(req.body.exclusive_start_date);
		const endDate = new Date(req.body.exclusive_end_date);
		const currentDate = new Date();

		if(startDate < currentDate){
			return res.status(400).send("Sales start date must be greater than current date.");
		}else if(endDate < startDate){
			return res.status(400).send("Sales end date must be greater than start date.");
		}else{
			req.body.exclusive_end_date = new Date(req.body.exclusive_end_date);
			req.body.exclusive_start_date = new Date(req.body.exclusive_start_date);
		}
	}

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send(errors[0].msg);
		return;
	}

	if (req.body.product_attributes && req.body.product_attributes.length > 0) {
		productAttributes = JSON.parse(req.body.product_attributes);
		delete req.body.product_attributes;
	}

	// If created by admin vendor_id present in body
	var vendorId;
	if(!req.body.vendor_id){      
		vendorId = req.user.Vendor.id
	}else{
		vendorId = req.body.vendor_id
	}

	bodyParams = req.body;
 	bodyParams['vendor_id'] = vendorId;
	bodyParams['publish_date'] = new Date();
	bodyParams['product_slug'] = string_to_slug(req.body.product_name);
	bodyParams['created_by'] = req.user.first_name;
	bodyParams['created_on'] = new Date();

	try {
		const existsVendorSKU = await service.findOneRow(productModelName, {
			sku: req.body.sku,
			vendor_id: vendorId
		});
		if (!existsVendorSKU) {
			const newProduct = await service.createRow(productModelName, bodyParams);
			for (let key in req.files) {
				if (key == "product_base_image") {
					if (req.files.hasOwnProperty(key)) {
						const parsedFile = path.parse(req.files[key].originalFilename);
						const timeInMilliSeconds = new Date().getTime();
						const uploadPath = config.images_base_path + "/products/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

						const productMediaUpload = await move(req.files[key].path, uploadPath);
						if (productMediaUpload) {
							productMediaPromises.push(service.createRow(productMediaModelName, {
								product_id: newProduct.id,
								type: 1,
								url: config.imageUrlRewritePath.base + "products/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext,
								base_image: 1,
								status: status['ACTIVE'],
								created_by: req.user.first_name,
								created_on: new Date()
							}));
						}
					}
				} else {
					if (req.files.hasOwnProperty(key)) {
						const parsedFile = path.parse(req.files[key].originalFilename);
						const timeInMilliSeconds = new Date().getTime();
						const uploadPath = config.images_base_path + "/products/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

						const productMediaUpload = await move(req.files[key].path, uploadPath);
						if (productMediaUpload) {
							productMediaPromises.push(service.createRow(productMediaModelName, {
								product_id: newProduct.id,
								type: 1,
								url: config.imageUrlRewritePath.base + "products/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext,
								base_image: 0,
								status: status['ACTIVE'],
								created_by: req.user.first_name,
								created_on: new Date()
							}));
						}
					}
				}
			}
			Promise.all(productMediaPromises);
			await Promise.all(productAttributes.map(async (productAttribute) => {
				ProductAttributePromises.push(service.upsertRow(productAttributeModelName, {
					product_id: newProduct.id,
					attribute_id: productAttribute.attribute_id,
					value: productAttribute.attribute_value,
					status: status['ACTIVE']
				}, {
					product_id: newProduct.id,
					attribute_id: productAttribute.attribute_id
				}, req.user.first_name));
			}));
			Promise.all(ProductAttributePromises);
			aunnouncementMailToSubscribedUser(newProduct); // New product launched announcement mail to vendor followers.
			return res.status(201).send(newProduct);
		} else {
			return res.status(409).send("Stock keeping unit already exists.");
		}
	} catch (error) {
		console.log('create Product Error:::', error);
		return res.status(500).send('Internal Server Error.');
	}
}

export async function edit(req, res) {

	var productID = req.params.id;
	var bodyParams = {};
	var productMediaPromises = [];
	var productAttributes = [];
	var ProductAttributePromises = [];
	var productModelName = "Product";
	var productMediaModelName = "ProductMedia";
	var productAttributeModelName = "ProductAttribute";

	req.checkBody('sku', 'Missing Query Param').notEmpty();
	req.checkBody('product_name', 'Missing Query Param').notEmpty();
	req.checkBody('status', 'Missing Query Param').notEmpty();
	req.checkBody('marketplace_id', 'Missing Query Param').notEmpty();
	req.checkBody('product_category_id', 'Missing Query Param').notEmpty();
	req.checkBody('sub_category_id', 'Missing Query Param').notEmpty();
	req.checkBody('product_location', 'Missing Query Param').notEmpty();
	req.checkBody('state_id', 'Missing Query Param').notEmpty();
	req.checkBody('city', 'Missing Query Param').notEmpty();
	req.checkBody('quantity_available', 'Missing Query Param').notEmpty();
	// Price not required for WTB,WTT,RFQ 
	//req.checkBody('price', 'Missing Query Param').notEmpty();

	//if (req.body.marketplace_id === marketplace['WHOLESALE']) {  // Not correct syntax
	if (req.body.marketplace_id == marketplace['WHOLESALE']) {
		req.checkBody('marketplace_type_id', 'Missing Query Param').notEmpty();
		req.checkBody('moq', 'Missing Query Param').notEmpty();
	} else {
		delete req.body.moq;
		delete req.body.marketplace_type_id;
	}

	if (req.body.exclusive_sale == 1) {
		req.body.exclusive_offer = parseInt(req.body.exclusive_offer);
		req.checkBody('exclusive_start_date', 'Missing Query Param').notEmpty();
		req.checkBody('exclusive_end_date', 'Missing Query Param').notEmpty();
		req.checkBody('exclusive_offer', 'Missing Query Param').notEmpty();

		const startDate = new Date(req.body.exclusive_start_date);
		const endDate = new Date(req.body.exclusive_end_date);
		const currentDate = new Date();

		// if(startDate <= currentDate){
		// 	return res.status(400).send("Start date must be greater than current date.");
		// }else 
		if(endDate < startDate){
			return res.status(400).send("End date must be greater than start date.");
		}else{
			req.body.exclusive_end_date = new Date(req.body.exclusive_end_date);
			req.body.exclusive_start_date = new Date(req.body.exclusive_start_date);
		}
	}

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}
	
	if (req.body.product_attributes && req.body.product_attributes.length > 0) {
		productAttributes = JSON.parse(req.body.product_attributes);
		delete req.body.product_attributes;
	}

	// If created by admin vendor_id present in body
	var vendorId;
	if(!req.body.vendor_id){      
		vendorId = req.user.Vendor.id
	}else{
		vendorId = req.body.vendor_id
	}

	bodyParams = req.body;
	bodyParams['vendor_id'] = vendorId;
	bodyParams['product_slug'] = string_to_slug(req.body.product_name);
	bodyParams['last_updated_by'] = req.user.first_name;
	bodyParams['last_updated_on'] = new Date();

	try {
		const existingProduct = await service.findIdRow(productModelName, productID);
		if (existingProduct) {
			const existsVendorSKU = await service.findOneRow(productModelName, {
				sku: req.body.sku,
				vendor_id: vendorId,
				id: {
					'$ne': existingProduct.id
				}
			});
			if (!existsVendorSKU) {
				const product = await service.updateRecordNew(productModelName, bodyParams, {
					id: existingProduct.id
				});
				for (let key in req.files) {
					if (req.files.hasOwnProperty(key)) {
						const parsedFile = path.parse(req.files[key].originalFilename);
						const timeInMilliSeconds = new Date().getTime();
						const uploadPath = config.images_base_path + "/products/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

						const productMediaUpload = await move(req.files[key].path, uploadPath);
						if (productMediaUpload) {
							productMediaPromises.push(service.createRow(productMediaModelName, {
								product_id: product.id,
								type: 1,
								url: config.imageUrlRewritePath.base + "products/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext,
								base_image: (key == "product_base_image")? 1 : 0,
								status: status['ACTIVE'],
								created_by: req.user.first_name,
								created_on: new Date()
							}));
						}
					}
				}
				Promise.all(productMediaPromises);
				await Promise.all(productAttributes.map(async (productAttribute) => {
					ProductAttributePromises.push(service.upsertRow(productAttributeModelName, {
						product_id: product.id,
						attribute_id: productAttribute.attribute_id,
						value: productAttribute.attribute_value,
						status: status['ACTIVE']
					}, {
						product_id: product.id,
						attribute_id: productAttribute.attribute_id
					}, req.user.first_name));
				}));
				Promise.all(ProductAttributePromises);
				return res.status(200).send(product);
			} else {
				return res.status(409).send("Stock keeping unit already exists.");
			}
		} else {
			return res.status(404).status("Product not found.");
		}
	} catch (error) {
		console.log('Edit Product Error:::', error);
		return res.status(500).send('Internal Server Error');
	}
}

function aunnouncementMailToSubscribedUser(newProduct) {
	var offset, limit, field, order;
	var vendorFollowerQueryObj = {},
		vendorFollowerIncludeArr = [];

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	vendorFollowerQueryObj = {
		vendor_id: newProduct.vendor_id,
		status: status['ACTIVE']
	}

	vendorFollowerIncludeArr = [{
		"model": model['User'],
		where: {
			status: status["ACTIVE"]
		},
		attributes: ['id', 'first_name', 'user_contact_email'],
	}, {
		"model": model['Vendor'],
		where: {
			status: status["ACTIVE"]
		},
		attributes: ['id', 'vendor_name'],
	}]

	return service.findAllRows('VendorFollower', vendorFollowerIncludeArr, vendorFollowerQueryObj, offset, limit, field, order)
		.then(function(vendorFollowers) {

			_.forOwn(vendorFollowers.rows, function(eachVendorFollower) {
				sentMailToFollowers(eachVendorFollower, newProduct);
			});

		}).catch(function(error) {
			return;
		})
}

function sentMailToFollowers(eachVendorFollower, newProduct) {

	var emailTemplateQueryObj = {};
	emailTemplateQueryObj['name'] = config.email.templates.newProductAnnouncementMail;
	var agenda = require('../../app').get('agenda');
	var marketplaceCode;
	if(newProduct.marketplace_id == marketplace.WHOLESALE)
		marketplaceCode = 'wholesale';	
	else if(newProduct.marketplace_id == marketplace.PUBLIC)
		marketplaceCode = 'shop';
	else if(newProduct.marketplace_id == marketplace.SERVICE)
		marketplaceCode = 'services';
	else if(newProduct.marketplace_id == marketplace.LIFESTYLE)
		marketplaceCode = 'lifestyle';

	return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
		.then(function(response) {
			if (response) {

				var email = eachVendorFollower.User.user_contact_email;
				var subject = response.subject;
				subject = subject.replace('%VENDOR_NAME%', eachVendorFollower.Vendor.vendor_name);
				var body;
				body = response.body.replace('%USER_NAME%', eachVendorFollower.User.first_name);
				body = body.replace(/%VENDOR_NAME%/g, eachVendorFollower.Vendor.vendor_name);
				body = body.replace('%PRODUCT_NAME%', newProduct.product_name);
				body = body.replace('%URL%', marketplaceCode + '/' + newProduct.product_slug + '/' + newProduct.id);

				var mailArray = [];
				mailArray.push({
					to: email,
					subject: subject,
					html: body
				});
				agenda.now(config.jobs.email, {
					mailArray: mailArray
				});
				return;
			} else {
				return;
			}
		}).catch(function(error) {
			return;
		})
}

export function move(copyFrom, moveTo) {
	return new Promise((resolve, reject) => {
		mv(copyFrom, moveTo, {
			clobber: true,
			mkdirp: true
		}, function(error) {
			if (!error) {
				return resolve(true);
			} else {
				return reject(error);
			}
		});
	});
}

export async function discountProduct(req, res) {
	var queryObj = {};
	var bodyParams = {};
	var productModelName = "Product";
	var productDiscountModelName = "ProductDiscount";
	var audit = req.user.first_name;

	req.checkBody('discount_type', 'Missing Query Param').notEmpty();
	req.checkBody('discount_value', 'Missing Query Param').notEmpty();
	req.checkBody('start_date', 'Missing Query Param').notEmpty();
	req.checkBody('end_date', 'Missing Query Param').notEmpty();
	req.checkBody('status', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}
	queryObj['id'] = req.body.id;
	bodyParams = req.body;

	try {
		const curentDateTime = moment().unix();
		const startDateTime = moment(bodyParams['start_date']).unix();
		const endDateTime = moment(bodyParams['end_date']).unix();

		if ((startDateTime > curentDateTime && startDateTime < endDateTime) && (endDateTime > startDateTime)) {
			const product = await service.findOneRow(productModelName, {
				id: req.params.product_id,
				vendor_id: req.user.Vendor.id
			});
			if (product) {
				if (product.status == status['ACTIVE']) {
					queryObj['product_id'] = product.id;
					bodyParams['product_id'] = product.id;

					const productDiscountResponse = await service.upsertRow(productDiscountModelName, bodyParams, queryObj, audit);
					const productDiscount = await productDiscountResponse.toJSON();
					return res.status(200).send(productDiscount);
				} else {
					return res.status(400).send("This product is not active stage.");
				}
			} else {
				return res.status(404).send("Product not found.");
			}
		} else {
			return res.status(400).send("Start/end date time invalid.");
		}
	} catch (error) {
		console.log("discountProduct Error:::", error);
		return res.status(500).send('Internal Server Error.');
	}
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
	req.checkBody('category', 'Missing Query Param').notEmpty();
	req.checkBody('sub_category', 'Missing Query Param').notEmpty();

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
										user: req.user,
										category: req.body.category,
										subCategory: req.body.sub_category
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
		return res.status(500).send('Internal Server Error');
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
	if (req.body && !req.body.amazon_category)
		return res.status(400).send("Missing Category");
	if (req.body && !req.body.amazon_sub_category)
		return res.status(400).send("Missing Sub Category");

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
	req.checkBody('category', 'Missing Query Param').notEmpty();
	req.checkBody('sub_category', 'Missing Query Param').notEmpty();

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
			return res.status(400).send('Invalid Credential');
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

export function vendorMarketplaces(req, res){	
	var vendorMarketplacesQueryObj = {}, planMarketplacesQueryObj = {};
	var planMarketplacesIncludeArr = [];
	var offset, limit, field, order;

	offset = 0;
	limit = null;
	field = 'id';
	order = 'asc';

	vendorMarketplacesQueryObj = {
		status: status.ACTIVE,
		vendor_id: req.params.vendor_id		
	}	

	planMarketplacesQueryObj = {
		status: status.ACTIVE
	}

	planMarketplacesIncludeArr = populate.populateData("Marketplace");
	var planMarketplaces={};
	
	service.findOneRow('VendorPlan', vendorMarketplacesQueryObj, [])
	.then(function(vendorPlanRow){
		if(vendorPlanRow){
			planMarketplacesQueryObj.plan_id = vendorPlanRow.plan_id;
			service.findRows('PlanMarketplace', planMarketplacesQueryObj, offset, limit, field, order, planMarketplacesIncludeArr)
			.then(function(planMarketplaces){
				return res.status(200).send(planMarketplaces);

			}).catch(function(error){
				console.log("Error::", error);
				return res.status(500).send(error);
			})
		}else{
			return res.status(200).send(planMarketplaces);
		}		
	}).catch(function(error){
		console.log("Error::",error);
		return res.status(500).send(error);
	})
}

export function planActiveVendors(req, res){	
	var currentDate = new Date();
	var offset, limit, field, order;
	var vendorIncludeArr = [];
	var vendorQueryObj = {};

	vendorQueryObj = {
		status: status.ACTIVE	
	}

	vendorIncludeArr = [
		{
			model:model['VendorPlan'],
			where: { 	status: status.ACTIVE,
						start_date:{ '$lte': currentDate },
						end_date:{ '$gte': currentDate }
					},
			attributes:['id']
		}
	]
	
	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	service.findRows('Vendor', vendorQueryObj, offset, limit, field, order, vendorIncludeArr)
	.then(function(vendor){
		return res.status(200).send(vendor);

	}).catch(function(error){
		console.log("Error::",error);
		return res.status(500).send(error);
	})
}

export function activeVendorProducts(req,res){
	var queryObj = {}, searchObj= {};
	var searchArray = [];
	var offset,limit, field, order;

	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	if (req.query.fields && req.query.text){
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

	productService.queryAllProducts(req.user.id, queryObj, offset, limit, field, order)
	.then(function(products) {
		return res.status(200).send(products);
	}).catch(function(error) {
		console.log('Error :::', error);
		return res.status(500).send(error);
	});
}


export async function createAttribute(req,res){

	var bodyParams ={}, categoryAttributeBodyParams ={};

	req.checkBody('attr_name', 'Attribute Name Missing').notEmpty();
	req.checkBody('category_id', 'Category Id Missing').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		return res.status(400).send({
			"message": "ERROR",
			"messageDetails": errors
		});
	}

	categoryAttributeBodyParams['category_id'] = req.body.category_id;
	delete req.body.category_id;

	bodyParams = req.body;
	bodyParams['status'] = categoryAttributeBodyParams['status'] = status['ACTIVE'];
	bodyParams['created_by'] = categoryAttributeBodyParams['created_by'] = req.user.first_name;
	bodyParams['created_on'] = categoryAttributeBodyParams['created_on'] = new Date();

	try{
		const newAttribute = await service.createRow('Attribute', bodyParams);
		if(newAttribute){
			categoryAttributeBodyParams['attribute_id'] = newAttribute.id;
			const newCategoryAttribute = await service.createRow('CategoryAttribute', categoryAttributeBodyParams);
			return res.status(200).send({
				"message": "Success",
				"messageDetails": "Attribute Created successfully."
			});
		}
	} catch(error){
		console.log("Error::", error);
		return res.status(500).send({
			"message": "ERROR",
			"messageDetails": errors
		});
	}
}

export async function updateAttribute(req,res){

	var attributeId = req.params.id;
	var bodyParams ={}, categoryAttributeBodyParams ={};

	req.checkBody('attr_name', 'Attribute Name Missing').notEmpty();
	req.checkBody('category_id', 'Category Id Missing').notEmpty();
	req.checkBody('status', 'Attribute status Missing').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		return res.status(400).send({
			"message": "ERROR",
			"messageDetails": errors
		});
	}

	categoryAttributeBodyParams['status'] = req.body.status;
	categoryAttributeBodyParams['category_id'] = req.body.category_id;
	delete req.body.category_id;

	bodyParams = req.body;
	bodyParams['last_updated_by'] = categoryAttributeBodyParams['last_updated_by'] = req.user.first_name;
	bodyParams['last_updated_on'] = categoryAttributeBodyParams['last_updated_on'] = new Date();

	try{

		const existingAttribute = await service.findIdRow('Attribute', attributeId);
		if (existingAttribute) {
			const updatedAttribute = await service.updateRecordNew('Attribute', bodyParams, {
				id: existingAttribute.id
			});
			if(updatedAttribute){
				const updatedCategoryAttribute = await service.updateRecordNew('CategoryAttribute', categoryAttributeBodyParams, {
					attribute_id: attributeId
				});
				return res.status(200).send({
					"message": "Success",
					"messageDetails": "Attribute Updated successfully."
				});
			}
		}else{
			return res.status(404).send({
				"message": "ERROR",
				"messageDetails": "Attribute Not Found."
			});
		}
	} catch(error){
		console.log("Error::", error);
		return res.status(500).send({
			"message": "ERROR",
			"messageDetails": errors
		});
	}
}