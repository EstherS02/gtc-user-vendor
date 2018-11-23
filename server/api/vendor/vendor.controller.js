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

export function index(req, res) {
	return new Promise((resolve, reject) => {
		let queryObj = {};
		let productQueryObj ={};
		let field = 'created_on';
		let order = 'desc';
		var params = req.query;
		let limit = req.query.limit? req.query.limit : 50;
		let offset = req.query.offset? req.query.offset * limit : 0;
		params.limit = limit;
		params.offset = offset;
		Sequelize_Instance.query(RawQueries.vendorWithProductCount(params), {
			model: model['Vendor'],
			type: Sequelize_Instance.QueryTypes.SELECT
		}).then((results) => {
			return res.status(200).send(results);
		}).catch(function(error) {
			console.log("error:::", error)
			return res.status(500).send(error);
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