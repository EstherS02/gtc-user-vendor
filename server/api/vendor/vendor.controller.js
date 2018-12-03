'use strict';

const mv = require('mv');
const path = require('path');
const crypto = require('crypto');
const uuid = require('node-uuid');
const moment = require('moment');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');
const plans = require('../../config/gtc-plan');
const durationUnit = require('../../config/duration-unit');
const service = require('../service');
const Sequelize_Instance = require('../../sqldb/index');
const RawQueries = require('../../raw-queries/sql-queries');
const sequelize = require('sequelize');

export async function createStarterSeller(req, res) {
	var queryObj = {};
	var bodyParams = {};
	var PlanModelName = "Plan";
	var userModelName = "User";
	var vendorModelName = "Vendor";
	var vendorPlanModelName = "VendorPlan";

	if (!req.files.vendor_profile_picture) {
		return res.status(400).send("Vendor profile picture missing.");
	}

	req.checkBody('vendor_name', 'Missing Query Param').notEmpty();
	req.checkBody('address', 'Missing Query Param').notEmpty();
	req.checkBody('base_location', 'Missing Query Param').notEmpty();
	req.checkBody('province_id', 'Missing Query Param').notEmpty();
	req.checkBody('city', 'Missing Query Param').notEmpty();
	req.checkBody('currency_id', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	bodyParams = req.body;
	bodyParams['user_id'] = req.user.id;
	bodyParams['status'] = status['ACTIVE'];
	bodyParams['created_on'] = new Date();
	bodyParams['created_by'] = req.user.first_name;

	queryObj['user_id'] = req.user.id;

	try {
		const existingVendor = await service.findOneRow(vendorModelName, queryObj);

		if (!existingVendor) {
			var planQueryObj = {};
			planQueryObj['status'] = status['ACTIVE'];
			planQueryObj['id'] = plans['STARTER_SELLER'];

			const startSellerPlan = await service.findOneRow(PlanModelName, planQueryObj);

			if (startSellerPlan) {
				const vendorProfilePicture = req.files.vendor_profile_picture;
				const parsedFile = path.parse(vendorProfilePicture.originalFilename);
				const timeInMilliSeconds = new Date().getTime();
				const uploadPath = config.images_base_path + "/vendor/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

				const vendorProfilePictureUpload = await move(vendorProfilePicture.path, uploadPath);
				if (vendorProfilePictureUpload) {
					bodyParams['vendor_profile_pic_url'] = config.imageUrlRewritePath.base + "vendor/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
				}

				if (req.files.vendor_cover_picture) {
					const vendorCoverPicture = req.files.vendor_cover_picture;
					const parsedFileVendorCover = path.parse(vendorCoverPicture.originalFilename);
					const timeInMilliSeconds = new Date().getTime();
					const uploadPathVendorCover = config.images_base_path + "/vendor/" + parsedFileVendorCover.name + "-" + timeInMilliSeconds + parsedFileVendorCover.ext;

					const vendorCoverPictureUpload = await move(vendorCoverPicture.path, uploadPathVendorCover);
					if (vendorCoverPictureUpload) {
						bodyParams['vendor_cover_pic_url'] = config.imageUrlRewritePath.base + "vendor/" + parsedFileVendorCover.name + "-" + timeInMilliSeconds + parsedFileVendorCover.ext;
					}
				}

				const newVendor = await service.createRow(vendorModelName, bodyParams);
				const updateExistingUser = await service.updateRow(userModelName, {
					role: roles['VENDOR'],
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				}, req.user.id);

				var verndorPlanObj = {};
				verndorPlanObj['vendor_id'] = newVendor.id;
				verndorPlanObj['plan_id'] = startSellerPlan.id;
				verndorPlanObj['status'] = status['ACTIVE'];
				verndorPlanObj['start_date'] = new Date();

				if (startSellerPlan.duration_unit == durationUnit['DAYS']) {
					verndorPlanObj['end_date'] = moment().add(startSellerPlan.duration, 'days').format('YYYY-MM-DD');
				}

				if (startSellerPlan.duration_unit == durationUnit['MONTHS']) {
					var totalDays = startSellerPlan.duration * 28;
					verndorPlanObj['end_date'] = moment().add(totalDays, 'days').format('YYYY-MM-DD');
				}

				verndorPlanObj['created_on'] = new Date();
				verndorPlanObj['created_by'] = req.user.first_name;

				const newPlan = await service.createRow(vendorPlanModelName, verndorPlanObj);
				return res.status(201).send("Vendor created successfully.");
			} else {
				return res.status(404).send("Plan not found.");
			}
		} else {
			return res.status(409).send("You already a vendor.");
		}
	} catch (error) {
		console.log("Error:::", error);
		return res.status(500).send(error);
	}
}
export async function createVendor(req, res) {
	var queryObj = {};
	var bodyParams = {};
	var PlanModelName = "Plan";
	var userModelName = "User";
	var vendorModelName = "Vendor";
	var vendorPlanModelName = "VendorPlan";
	var bodyParamsUser = {};

	if (!req.files.vendor_profile_picture) {
		return res.status(400).send({
			"message": "Error",
			"messageDetails": "Vendor profile picture missing."
		});
	}

	req.checkBody('vendor_name', 'Vendor Name is Missing').notEmpty();
	req.checkBody('address', 'Vendor Address is Missing').notEmpty();
	req.checkBody('base_location', 'Vendor Country is Missing').notEmpty();
	req.checkBody('province_id', 'Vendor Province is Missing').notEmpty();
	req.checkBody('city', 'Vendor City is Missing').notEmpty();
	req.checkBody('currency_id', 'Vendor Currency is Missing').notEmpty();
	req.checkBody('email', 'Email is Missing').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		console.log("Error::", errors)
		return res.status(400).send({
			"message": "Error",
			"messageDetails": errors[0].msg
		});
	}

	bodyParams = req.body;
	bodyParams['status'] = status['ACTIVE'];
	bodyParams['created_on'] = new Date();
	bodyParams['created_by'] = req.user.first_name;

	queryObj['email'] = req.body.email;

	try {
		const existingUser = await service.findOneRow(userModelName, queryObj);
		if (!existingUser) {
			bodyParamsUser['first_name'] = req.body.first_name;
			bodyParamsUser['last_name'] = req.body.last_name;
			bodyParamsUser['email'] = req.body.email;
			bodyParamsUser['user_contact_email'] = req.body.email;
			bodyParamsUser["provider"] = providers["OWN"];
			bodyParamsUser["contact_email"] = req.body.email;
			bodyParamsUser["status"] = status["ACTIVE"];
			bodyParamsUser["role"] = roles["VENDOR"];
			bodyParamsUser["email_verified"] = 1;
			bodyParamsUser['created_on'] = new Date();


			const newUser = await service.createRow(userModelName, bodyParamsUser);
			if (newUser) {
				var planQueryObj = {};
				planQueryObj['status'] = status['ACTIVE'];
				planQueryObj['id'] = plans['STARTER_SELLER'];

				bodyParams['user_id'] = newUser.id;

				const startSellerPlan = await service.findOneRow(PlanModelName, planQueryObj);

				if (startSellerPlan) {
					const vendorProfilePicture = req.files.vendor_profile_picture;
					const parsedFile = path.parse(vendorProfilePicture.originalFilename);
					const timeInMilliSeconds = new Date().getTime();
					const uploadPath = config.images_base_path + "/vendor/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

					const vendorProfilePictureUpload = await move(vendorProfilePicture.path, uploadPath);
					if (vendorProfilePictureUpload) {
						bodyParams['vendor_profile_pic_url'] = config.imageUrlRewritePath.base + "vendor/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
					}

					if (req.files.vendor_cover_picture) {
						const vendorCoverPicture = req.files.vendor_cover_picture;
						const parsedFileVendorCover = path.parse(vendorCoverPicture.originalFilename);
						const timeInMilliSeconds = new Date().getTime();
						const uploadPathVendorCover = config.images_base_path + "/vendor/" + parsedFileVendorCover.name + "-" + timeInMilliSeconds + parsedFileVendorCover.ext;

						const vendorCoverPictureUpload = await move(vendorCoverPicture.path, uploadPathVendorCover);
						if (vendorCoverPictureUpload) {
							bodyParams['vendor_cover_pic_url'] = config.imageUrlRewritePath.base + "vendor/" + parsedFileVendorCover.name + "-" + timeInMilliSeconds + parsedFileVendorCover.ext;
						}
					}

					const newVendor = await service.createRow(vendorModelName, bodyParams);

					var verndorPlanObj = {};
					verndorPlanObj['vendor_id'] = newVendor.id;
					verndorPlanObj['plan_id'] = startSellerPlan.id;
					verndorPlanObj['status'] = status['ACTIVE'];
					verndorPlanObj['start_date'] = new Date();
					verndorPlanObj['user_id'] = newUser.id;

					if (startSellerPlan.duration_unit == durationUnit['DAYS']) {
						verndorPlanObj['end_date'] = moment().add(startSellerPlan.duration, 'days').format('YYYY-MM-DD');
					}

					if (startSellerPlan.duration_unit == durationUnit['MONTHS']) {
						var totalDays = startSellerPlan.duration * 28;
						verndorPlanObj['end_date'] = moment().add(totalDays, 'days').format('YYYY-MM-DD');
					}

					verndorPlanObj['created_on'] = new Date();
					verndorPlanObj['created_by'] = req.user.first_name;

					const newPlan = await service.createRow(vendorPlanModelName, verndorPlanObj);
					return res.status(201).send({
						"message": "Success",
						"messageDetails": "Vendor created successfully."
					});
				} else {
					return res.status(404).send({
						"message": "Error",
						"messageDetails": "Plan not found."
					});
				}
			} else {
				return res.status(404).send({
					"message": "Error",
					"messageDetails": "Unable to create User."
				});
			}
		} else {
			return res.status(409).send({
				"message": "Error",
				"messageDetails": "Email already exists."
			});
		}
	} catch (error) {
		console.log("Error:::", error);
		return res.status(500).send({
			"message": "Error",
			"messageDetails": "Internal server error."
		});
	}
}

export async function edit(req, res) {

	var queryObj = {};
	var bodyParams = {};
	var PlanModelName = "Plan";
	var userModelName = "User";
	var vendorModelName = "Vendor";
	var vendorPlanModelName = "VendorPlan";
	var userBodyParam = {};

	req.checkBody('first_name', 'First Name is Missing').notEmpty();
	req.checkBody('vendor_name', 'Vendor Name is Missing').notEmpty();
	req.checkBody('address', 'Vendor Address is Missing').notEmpty();
	req.checkBody('base_location', 'Vendor Country is Missing').notEmpty();
	req.checkBody('province_id', 'Vendor State is Missing').notEmpty();
	req.checkBody('city', 'Vendor City is Missing').notEmpty();
	req.checkBody('currency_id', 'Vendor Currency is Missing').notEmpty();
	req.checkBody('email', 'Email is Missing').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		console.log("Error::", errors)
		return res.status(400).send({
			"message": "Error",
			"messageDetails": errors[0].msg
		});
	}

	bodyParams = req.body;
	//bodyParams['status'] = status['ACTIVE'];
	bodyParams['last_updated_on'] = new Date();
	bodyParams['last_updated_by'] = req.user.first_name;

	userBodyParam['first_name'] = req.body.first_name;
	userBodyParam['last_name'] = req.body.last_name;
	userBodyParam['status'] = req.body.status;
	userBodyParam['email_verified'] = req.body.email_verified;
	userBodyParam['last_updated_on'] = new Date();
	userBodyParam['last_updated_by'] = req.user.first_name;

	queryObj['id'] = req.params.id;
	if (req.files.vendor_profile_picture) {
		const vendorProfilePicture = req.files.vendor_profile_picture;
		const parsedFile = path.parse(vendorProfilePicture.originalFilename);
		const timeInMilliSeconds = new Date().getTime();
		const uploadPath = config.images_base_path + "/vendor/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

		const vendorProfilePictureUpload = await move(vendorProfilePicture.path, uploadPath);
		if (vendorProfilePictureUpload) {
			bodyParams['vendor_profile_pic_url'] = config.imageUrlRewritePath.base + "vendor/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
		}
	}

	if (req.files.vendor_cover_picture) {
		const vendorCoverPicture = req.files.vendor_cover_picture;
		const parsedFileVendorCover = path.parse(vendorCoverPicture.originalFilename);
		const timeInMilliSeconds = new Date().getTime();
		const uploadPathVendorCover = config.images_base_path + "/vendor/" + parsedFileVendorCover.name + "-" + timeInMilliSeconds + parsedFileVendorCover.ext;

		const vendorCoverPictureUpload = await move(vendorCoverPicture.path, uploadPathVendorCover);
		if (vendorCoverPictureUpload) {
			bodyParams['vendor_cover_pic_url'] = config.imageUrlRewritePath.base + "vendor/" + parsedFileVendorCover.name + "-" + timeInMilliSeconds + parsedFileVendorCover.ext;
		}
	}
	try {
		const existingVendor = await service.findOneRow(vendorModelName, queryObj);
		if (!existingVendor) {
			return res.status(400).send({
				"message": "Error",
				"messageDetails": "Vendor Not Access."
			});
		} else {
			const updateExistingVendor = await service.updateRecordNew(vendorModelName, bodyParams, {
				id:req.params.id
			});

			const User = await service.updateRecordNew(userModelName, userBodyParam, {
				id: existingVendor.user_id
			});	

			return res.status(200).send({
				"message": "Success",
				"messageDetails": "Vendor Updated successfully."
			});
		}
	} catch (error) {
		console.log("Error:::", error);
		return res.status(500).send({
			"message": "Error",
			"messageDetails": "Internal server error."
		});
	}
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

export function deleteVendor(req, res) {
	var existsTable = [];
	var deleteTable = [];
	var userTable = [];
	var vendorModel = 'Vendor';
	var userModel = 'User';
	var ids = JSON.parse(req.body.ids);
	var returnResponse = [];
	var userQueryObj = {};
	var queryObj = {};
	queryObj['status'] = status['ACTIVE'];

	for (let i = 0; i < ids.length; i++) {
		queryObj['id'] = ids[i];
		existsTable.push(service.findOneRow(vendorModel, queryObj, []))
	}
	Promise.all(existsTable).then((response) => {

		if (response.length > 0) {
			for (let i = 0; i < response.length; i++) {
				queryObj['id'] = response[i].id;
				userQueryObj['id'] = response[i].user_id;
				deleteTable.push(service.updateRecord(vendorModel, {
					status: status['DELETED']
				}, queryObj));
				userTable.push(service.updateRecord(userModel, {
					status: status['DELETED']
				}, userQueryObj));
			}

			Promise.all(deleteTable).then((response) => {
				returnResponse.push(response);
			});
			Promise.all(userTable).then((response) => {
				returnResponse.push(response);
			});
			return res.status(200).send(returnResponse);

		} else {
			return res.status(500).send("No data found.");
		}
	});
}
export function index(req, res) {
	return new Promise((resolve, reject) => {
		var queryObj = {};
		var queryObj1 = {};
		let productQueryObj = {};
		let field = 'id';
		let order = 'asc';
		var params = req.query;
		let limit = req.query.limit ? parseInt(req.query.limit) : 10;
		let offset = req.query.offset ? parseInt(req.query.offset) : 0;
		var vendorPlanQuery = {};
		var userQueryObj = {};
		userQueryObj.role = roles['VENDOR'];
		userQueryObj['status']={
				'$ne': status["DELETED"]
			};

		vendorPlanQuery.status = 1;
		

		if (req.query.status)
			queryObj['status'] = queryObj1['status'] = req.query.status
		else {
			queryObj['status'] = queryObj1['status'] ={
				'$ne': status["DELETED"]
			}
		}

		if (req.query.text) {
			queryObj['$or'] = [
				sequelize.where(sequelize.fn('concat_ws', sequelize.col('User.first_name'), ' ', sequelize.col('User.last_name'), ' ', sequelize.col('vendor_name')), {
					$like: '%' + req.query.text + '%'
				})
			];
		}
		var countIncludeArr = [{
			model: model['User'],
			where: userQueryObj,
			attributes: ['first_name', 'last_name']
		}];
		let results = {};
		var includeArr = [{
			model: model['User'],
			where: userQueryObj,
			attributes: ['first_name', 'last_name']
		}, {
			model: model['Product'],
			attributes: [],
			required: false
		}];

		if (req.query.plan_id) {
			vendorPlanQuery.plan_id = req.query.plan_id;
			includeArr.push({
				model: model['VendorPlan'],
				where: vendorPlanQuery,
				attributes: ['plan_id'],
				required:false
			});
		} else {
			includeArr.push({
				model: model['VendorPlan'],
				where: vendorPlanQuery,
				attributes: ['plan_id'],
				required: false
			});
		}
		var result = {};
		model["Vendor"].findAll({
			include: includeArr,
			where: queryObj,
			subQuery: false,
			attributes: ['id', 'vendor_name', 'user_id', 'status', 'created_on', [sequelize.literal('COUNT(Products.id)'), 'product_count']],
			offset: offset,
			limit: limit,
			group: ['id'],
			order: [
				[field, order]
			]
		}).then(function(rows) {
			if (rows.length > 0) {
				return model['Vendor'].count({
					where: queryObj1,
					include:countIncludeArr
				}).then(function(count) {
					result.count = count;
					result.rows = rows;
					return res.status(200).send(result);
				}).catch(function(error) {
					return res.status(500).send("Internal Server Error");
				});
			} else {
				result.count = 0;
				result.rows = rows;
				return res.status(200).send(result);
			}
		}).catch(function(error) {
			console.log("error:::::", error)
			return res.status(500).send("Internal Server Error");
		});
	});
}

export function create(req, res) {
	var queryObj = {};
	var vendorBodyParams = {};
	var randomCode = uuid.v1();

	req.checkBody('first_name', 'Missing Query Param').notEmpty();
	req.checkBody('provider', 'Missing Query Param').notEmpty();

	if (req.body.provider == providers["OWN"]) {
		req.checkBody('email', 'Missing Query Param').notEmpty();
		req.checkBody('email', 'Please enter a valid email address').isEmail();
		req.checkBody('email', 'Email Address lowercase letters only').isLowercase();
		req.checkBody('password', 'Missing Query Param').notEmpty();
	}

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	req.body.salt = makeSalt();
	req.body.hashed_pwd = encryptPassword(req);

	var bodyParams = req.body;

	if (req.body.vendor_name) {
		vendorBodyParams.vendor_name = req.body.vendor_name;
		delete req.body.vendor_name;
	}
	if (req.body.contact_email) {
		vendorBodyParams.contact_email = req.body.contact_email;
		delete req.body.contact_email;
	}
	if (req.body.base_location) {
		vendorBodyParams.base_location = req.body.base_location;
		delete req.body.base_location;
	}
	if (req.body.vendor_cover_pic_url) {
		vendorBodyParams.vendor_cover_pic_url = req.body.vendor_cover_pic_url;
		delete req.body.vendor_cover_pic_url;
	}
	if (req.body.vendor_profile_pic_url) {
		vendorBodyParams.vendor_profile_pic_url = req.body.vendor_profile_pic_url;
		delete req.body.vendor_profile_pic_url;
	}
	if (req.body.facebook_url) {
		vendorBodyParams.facebook_url = req.body.facebook_url;
		delete req.body.facebook_url;
	}
	if (req.body.google_plus_url) {
		vendorBodyParams.google_plus_url = req.body.google_plus_url;
		delete req.body.google_plus_url;
	}
	if (req.body.twitter_url) {
		vendorBodyParams.twitter_url = req.body.twitter_url;
		delete req.body.twitter_url;
	}
	if (req.body.linkedin_url) {
		vendorBodyParams.linkedin_url = req.body.linkedin_url;
		delete req.body.linkedin_url;
	}
	if (req.body.youtube_url) {
		vendorBodyParams.youtube_url = req.body.youtube_url;
		delete req.body.youtube_url;
	}
	if (req.body.instagram_url) {
		vendorBodyParams.instagram_url = req.body.instagram_url;
		delete req.body.instagram_url;
	}
	if (req.body.flickr_url) {
		vendorBodyParams.flickr_url = req.body.flickr_url;
		delete req.body.flickr_url;
	}
	if (req.body.currency_id) {
		vendorBodyParams.currency_id = req.body.currency_id;
		delete req.body.currency_id;
	}
	if (req.body.timezone_id) {
		vendorBodyParams.timezone_id = req.body.timezone_id;
		delete req.body.timezone_id;
	}

	bodyParams['created_on'] = new Date();

	if (req.body.provider == providers["OWN"]) {
		bodyParams["email_verified"] = 0;
		bodyParams['email_verified_token'] = randomCode;
		bodyParams['email_verified_token_generated'] = new Date();
	}

	if (req.body.email) {
		queryObj['email'] = req.body.email;
	}

	model['User'].findOne({
		where: queryObj
	}).then(function(user) {
		if (user) {
			res.status(409).send("Email address already exists");
			return;
		} else {
			bodyParams["status"] = status["ACTIVE"];
			bodyParams["role"] = roles["VENDOR"];
			bodyParams["contact_email"] = req.body.email;
			model['User'].create(bodyParams)
				.then(function(user) {
					if (user) {
						const rspUser = plainTextResponse(user);
						delete rspUser.salt;
						delete rspUser.hashed_pwd;
						delete rspUser.email_verified_token;
						delete rspUser.email_verified_token_generated;

						vendorBodyParams.user_id = rspUser.id;
						vendorBodyParams['created_on'] = new Date();
						vendorBodyParams["status"] = status["ACTIVE"];

						model['Vendor'].create(vendorBodyParams)
							.then(function(vendor) {
								if (vendor) {
									res.status(201).send(rspUser);
									return;
								} else {
									res.status(404).send("Not found");
									return;
								}
							}).catch(function(error) {
								console.log('Error :::', error);
								res.status(500).send("Internal server error");
								return;
							})
					}
				})
				.catch(function(error) {
					console.log('Error :::', error);
					res.status(500).send("Internal server error");
					return;
				});
		}
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return
	});
}

export function me(req, res) {
	if (req.user) {
		delete req.user.email_verified_token;
		delete req.user.email_verified_token_generated;
		delete req.user.forgot_password_token;
		delete req.user.forgot_password_token_generated;
		delete req.user.hashed_pwd;
		delete req.user.salt;
		res.status(200).send(req.user);
		return;
	}
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}

function authenticate(plainText, user) {
	var customBody = {
		body: {
			password: plainText,
			salt: user.salt,
			email: user.email
		}
	};
	return encryptPassword(customBody) == user.hashed_pwd;
}

function makeSalt() {
	return crypto.randomBytes(16).toString('base64');
}

function encryptPassword(req) {
	if (!req.body.password || !req.body.salt)
		return '';
	var saltWithEmail = new Buffer(req.body.salt + req.body.email.toString('base64'), 'base64');
	return crypto.pbkdf2Sync(req.body.password, saltWithEmail, 10000, 64, 'sha1').toString('base64');
}

exports.authenticate = authenticate;