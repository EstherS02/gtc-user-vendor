'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');
const service = require('../service');
const moment = require('moment');

export function index(req, res) {
			console.log("------------------------------")

	var offset, limit, field, order;
	var queryObj = {};

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	queryObj = req.query;
	queryObj.role = roles['USER'];

	model['User'].findAndCountAll({
		where: queryObj,
		offset: offset,
		limit: limit,
		include:[{
			model:model['Order'],
			where:{
				status:status['ACTIVE']
			},
			attributes:['id'],
			requires:false
		}],
		attributes: {
			exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
		},
		order: [
			[field, order]
		],
		raw: true
	}).then(function(rows) {
			console.log("------------------------------",rows.rows)

		if (rows.length > 0) {

			res.status(200).send(rows);
			return;
		} else {
			res.status(200).send(rows);
			return;
		}
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return
	})
}

export function create(req, res) {
	var queryObj = {};
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
		res.status(400).send('Oops, something was not right');
		return;
	}

	var bodyParams = req.body;
	bodyParams['salt'] = makeSalt();
	bodyParams['hashed_pwd'] = encryptPassword(req);

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
			bodyParams['user_contact_email'] = req.body.email;
			bodyParams['created_by'] = bodyParams['first_name'];
			bodyParams['created_on'] = new Date();
			bodyParams["role"] = roles["USER"];
			bodyParams["status"] = status["ACTIVE"];

			model['User'].create(bodyParams)
				.then(function(userObj) {
					if (userObj) {
						const user = userObj.toJSON();
						var email_verified_token = user.email_verified_token;
						delete user.salt;
						delete user.hashed_pwd;
						delete user.email_verified_token;
						delete user.email_verified_token_generated;

						var queryObjEmailTemplate = {};
						var emailTemplateModel = "EmailTemplate";
						queryObjEmailTemplate['name'] = config.email.templates.userCreate;
						var agenda = require('../../app').get('agenda');
						
						service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
							.then(function(response) {
								if (response) {
									var username = user["first_name"];
									var email = user["user_contact_email"];
									var subject = response.subject.replace('%USERNAME%', username);
									var body;
									body = response.body.replace('%USERNAME%', username);
									body = body.replace('%LINK%', config.baseUrl + '/user-verify?email=' + email + "&email_verified_token=" + email_verified_token);

									var mailArray = [];
									mailArray.push({
										to: email,
										subject: subject,
										html: body
									});
									agenda.now(config.jobs.email, {
										mailArray: mailArray
									});
									return res.status(201).send(user);
								} else {
									return res.status(201).send(user);
								}
							}).catch(function(error) {
								console.log('Error :::', error);
								res.status(500).send("Internal server error");
								return;
							});
					} else {
						return res.status(400).send("Failed to create.");
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

export function resend(req, res) {
	var bodyParams = {};
	bodyParams['email_verified_token'] = uuid.v1();;
	bodyParams['email_verified_token_generated'] = new Date();

	model['User'].findOne({
		where: {
			id: req.user.id
		}
	}).then(function(user) {
		if (user) {
			model['User'].update(bodyParams, {
				where: {
					id: req.user.id			
				}
			}).then(function(userObj) {
				if (userObj) {
					model['User'].findOne({
						where: {
							id: req.user.id
						}
					}).then(function(data) {
						if (data) {
							const user = data.toJSON();
							var email_verified_token = user.email_verified_token;
							delete user.salt;
							delete user.hashed_pwd;
							delete user.email_verified_token;
							delete user.email_verified_token_generated;

							var queryObjEmailTemplate = {};
							var emailTemplateModel = "EmailTemplate";
							queryObjEmailTemplate['name'] = config.email.templates.userCreate;
							var agenda = require('../../app').get('agenda');

							service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
								.then(function(response) {
									if (response) {
										var username = user["first_name"];
										var email = user["user_contact_email"];
										var subject = response.subject.replace('%USERNAME%', username);
										var body;
										body = response.body.replace('%USERNAME%', username);
										body = body.replace('%LINK%', config.baseUrl + '/user-verify?email=' + email + "&email_verified_token=" + email_verified_token);

										var mailArray = [];
										mailArray.push({
											to: email,
											subject: subject,
											html: body
										});
										agenda.now(config.jobs.email, {
											mailArray: mailArray
										});
										return res.status(201).send(user);
									} else {
										return res.status(201).send(user);
									}
								}).catch(function(error) {
									console.log('Error :::', error);
									res.status(500).send("Internal server error");
									return;
								});
						} else {
							res.status(500).send("Internal server error");
						}
					})
				} else {
					return res.status(400).send("Failed to create.");
				}
			}).catch(function(error) {
				console.log('Error :::', error);
				res.status(500).send("Internal server error");
				return;
			});
		} else {
			res.status(500).send("Mail is not Registered");
		}
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return;
	});
}

export function userAuthenticate(req, res) {
	var UserModel = "User";
	var includeArr = [];
	var queryObj = {};

	queryObj.email_verified_token = req.body.email_verified_token;
	queryObj.email = req.body.email;
	service.findOneRow(UserModel, queryObj, includeArr)
		.then(function(resp) {
			if (resp) {
				var expiryTime = moment(resp.email_verified_token_generated).add(24, 'hours').valueOf();
				var currentTime = moment().valueOf();
				if (currentTime < expiryTime) {
					if (resp.email_verified == 0) {
						var updateObj = {};
						updateObj.email_verified = 1;
						service.updateRow(UserModel, updateObj, resp.id)
							.then(function(updateRsp) {
								res.status(200).send("Email has been registered Successfully");
								return;
							})
							.catch(function(err) {
								res.status(500).send("Unable to update");
								return;
							})
					} else {
						console.log("You are in");
						res.status(409).send("Email already verified");
						return;
					}
				} else {
					res.status(400).send("Request Time Out");
					return;
				}
			} else {
				res.status(404).send("Not Fouond");
				return;
			}
		})
		.catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return;
		})
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

export function destroy(req, res) {
	const ids = req.params.ids.split(' ').map(Number);
	model['User'].destroy({
		where: {
			id: ids
		}
	}).then(function(row) {
		if (row > 0) {
			res.status(200).send("Users deleted successfully");
			return;
		} else {
			res.status(404).send("Cannot delete users");
			return
		}
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return
	})
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

export function changePassword(req, res) {

	if (req.body) {
		req.checkBody('old_password', 'Missing Query Param').notEmpty();
		req.checkBody('new_password', 'Missing Query Param').notEmpty();
		req.checkBody('new_confirm_password', 'Missing Query Param').notEmpty();
		req.checkBody('new_confirm_password', 'new_confirm_password should be equal to new_password').equals(req.body.new_password);
	}
	var errors = req.validationErrors();
	if (errors) {
		console.log("error", errors)
		res.status(400).send(errors);
		return;
	}
	var UserModel = "User";
	var userId = req.user.id;
	service.findIdRow(UserModel, userId, []).then(function(result) {
		if (authenticate(req.body.old_password, result)) {
			var saltWithEmail = new Buffer(result.salt + result.email.toString('base64'), 'base64');
			var hashedPassword = crypto.pbkdf2Sync(req.body.new_password, saltWithEmail, 10000, 64, 'sha1').toString('base64');
			var bodyParams = {
				hashed_pwd: hashedPassword
			};
			service.updateRow(UserModel, bodyParams, userId).then(function(response) {
				if (response) {
					res.status(200).send("Password Updated successfully")
					return;
				} else {
					res.status(304).send("Password Unable to update")
					return;
				}
			})
		} else {
			return res.status(401).send("Invalid Old Password");

		}
	});
}

export function resetPassword(req, res) {
	var queryObj, forgot_password_token, current_time, expire_time1, expire_time2;

	if (req.body) {
		req.checkBody('email', 'Missing Query Param').notEmpty();
		req.checkBody('new_password', 'Missing Query Param').notEmpty();
		req.checkBody('new_confirm_password', 'Missing Query Param').notEmpty();
		req.checkBody('new_confirm_password', 'new_confirm_password should be equal to new_password').equals(req.body.new_password);
	}
	var errors = req.validationErrors();
	if (errors) {
		console.log("error", errors)
		res.status(400).send(errors);
		return;
	}
	var UserModel = "User";

	forgot_password_token = req.body.forgot_password_token;

	queryObj = {
		email: req.body.email
	}

	service.findOneRow(UserModel, queryObj, []).then(function(result) {
		var userId = result.id;
		var saltWithEmail = new Buffer(result.salt + result.email.toString('base64'), 'base64');
		var hashedPassword = crypto.pbkdf2Sync(req.body.new_password, saltWithEmail, 10000, 64, 'sha1').toString('base64');
		var bodyParams = {
			hashed_pwd: hashedPassword,
			forgot_password_token: null,
			forgot_password_token_generated: null
		};


		if (result.forgot_password_token != forgot_password_token) {
			res.status(400).send("The forgot password link sent to your mail has been expired. Please generate new forget password password link by clicking the above forgot password button.");
			return;
		}

		current_time = new Date();
		expire_time1 = result.forgot_password_token_generated;
		expire_time2 = moment(expire_time1).add(24, 'hours');

		if (current_time >= expire_time2) {
			res.status(400).send("The forgot password link sent to your mail has been expired. Please generate new forget password password link by clicking the above forgot password button.");
			return;
		}
		service.updateRow(UserModel, bodyParams, userId).then(function(response) {
			if (response) {
				res.status(200).send("Your password has been updated successfully. Please login with the new password.")
				return;
			} else {
				res.status(304).send("Password Unable to update")
				return;
			}
		})
	});
}


export function userProfile(req, res) {

	var userUpdate = JSON.parse(req.body.userUpdate);
	var user_id = req.user.id;
	var billing_address_type = 1;
	var shipping_address_type = 2;

	service.updateRow('User', userUpdate, user_id)
		.then(function(row) {

			if (req.body.billingUpdate) {
				var addressUpdatePromises = [];

				var billingUpdate = JSON.parse(req.body.billingUpdate);
				billingUpdate['user_id'] = req.user.id;
				billingUpdate['status'] = 1;

				addressUpdatePromises.push(addressUpdate(user_id, billing_address_type, billingUpdate));
				return Promise.all(addressUpdatePromises);
			}
		}).then(function(billingUpdatedRow) {
			if (req.body.shippingUpdate) {

				var addressUpdatePromises = [];

				var shippingUpdate = JSON.parse(req.body.shippingUpdate);
				shippingUpdate['user_id'] = req.user.id;
				shippingUpdate['status'] = 1;

				addressUpdatePromises.push(addressUpdate(user_id, shipping_address_type, shippingUpdate));
				return Promise.all(addressUpdatePromises);
			}
		}).then(function(response) {
			return res.status(200).send("Updated Successfully");
		})
		.catch(function(err) {
			console.log("Error::", err);
			res.status(500).send(err);
			return;
		})
}

function addressUpdate(user_id, address_type, obj) {
	service.findRow('Address', {
			user_id: user_id,
			address_type: address_type
		}, [])
		.then(function(row) {
			if (row) {
				var updateAddressPromises = [];

				updateAddressPromises.push(updateAddress(obj, row.id));
				return Promise.all(updateAddressPromises);
			} else {
				var createAddressPromises = [];

				createAddressPromises.push(createAddress(obj));
				return Promise.all(createAddressPromises);
			}
		}).catch(function(err) {
			console.log("Error::", err);
			return Promise.reject(err);
		})
}

function createAddress(obj) {
	service.createRow('Address', obj)
		.then(function(create) {
			return Promise.resolve(create);
		}).catch(function(err) {
			console.log("Error::", err);
			return Promise.reject(err);
		})
}

function updateAddress(obj, id) {
	service.updateRow('Address', obj, id)
		.then(function(update) {
			return Promise.resolve(update);
		}).catch(function(err) {
			console.log("Error::", err)
			return Promise.reject(err);
		})
}

function updateVendor(vendorBodyParam, vendorId) {

	service.updateRow('Vendor', vendorBodyParam, vendorId)
		.then(function(updatedVendor) {
			return Promise.resolve(updatedVendor);
		}).catch(function(err) {
			console.log("Error::", err)
			return Promise.reject(err);
		})
}

export async function vendorFollow(req, res) {
	var queryObj = {};
	const vendorFollowerModelName = "VendorFollower";

	req.checkBody('vendor_id', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	try {
		const exists = await service.findOneRow(vendorFollowerModelName, {
			vendor_id: req.body.vendor_id,
			user_id: req.user.id
		});
		if (exists && exists.status == status['ACTIVE']) {
			const updateResponse = await service.updateRecordNew(vendorFollowerModelName, {
				status: status['INACTIVE'],
				last_updated_on: new Date(),
				last_updated_by: req.user.first_name
			}, {
				user_id: req.user.id,
				vendor_id: req.body.vendor_id
			});
			return res.status(200).send("OK");
		} else if (exists && exists.status == status['INACTIVE']) {
			const updateResponse = await service.updateRecordNew(vendorFollowerModelName, {
				status: status['ACTIVE'],
				last_updated_on: new Date(),
				last_updated_by: req.user.first_name
			}, {
				user_id: req.user.id,
				vendor_id: req.body.vendor_id
			});
			return res.status(200).send("OK");
		} else {
			const createResponse = await service.createRow(vendorFollowerModelName, {
				vendor_id: req.body.vendor_id,
				user_id: req.user.id,
				status: status['ACTIVE'],
				created_on: new Date(),
				created_by: req.user.first_name
			});
			return res.status(200).send("OK");
		}
	} catch (error) {
		console.log("vendorFollow Error:::", error);
		return res.status(500).send(error);
	}
}

export function forgotPassword(req, res) {

	var queryParams = {},
		bodyParams = {},
		user_id;
	var userModel = 'User';
	var randomCode = uuid.v1();
	var queryParams = {
		email: req.params.email
	};

	service.findOneRow(userModel, queryParams, [])
		.then(function(user) {
			if (user) {
				user_id = user.id;
				bodyParams['forgot_password_token'] = randomCode;
				bodyParams['forgot_password_token_generated'] = new Date();

				service.updateRow(userModel, bodyParams, user_id)
					.then(function(result) {

						if (result) {

							var forgot_password_token = bodyParams['forgot_password_token'];
							delete user.salt;
							delete user.hashed_pwd;
							delete user.email_verified_token;
							delete user.email_verified_token_generated;

							var queryObjEmailTemplate = {};
							var emailTemplateModel = "EmailTemplate";
							queryObjEmailTemplate['name'] = config.email.templates.passwordReset;
							var agenda = require('../../app').get('agenda');

							service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
								.then(function(response) {
									if (response) {
										if (user.user_contact_email) {
											var username = user["first_name"];
											var email = user["user_contact_email"];

											var subject = response.subject;
											var body;
											body = response.body.replace('%USERNAME%', username);
											body = body.replace('%LINK%', config.baseUrl + '/user/reset-password?email=' + email + "&forgot_password_token=" + forgot_password_token);

											var mailArray = [];
											mailArray.push({
												to: email,
												subject: subject,
												html: body
											});
											agenda.now(config.jobs.email, {
												mailArray: mailArray
											});
											return res.status(201).send("Instructions have been sent to your associated email account. Check your email and follow the instructions to reset your password.");
										} else {
											return res.status(201).send("You didn't have contact email to reset your password.");
										}
									} else {
										return res.status(404).send("Unable to reset password. Please try later.");
									}
								}).catch(function(error) {
									console.log('Error :::', error);
									res.status(500).send("Internal server error. Please try later.");
									return;
								});
						} else {
							res.status(404).send("Unable to reset password. Please try later");
							return;
						}
					})
			} else {
				res.status(404).send("Your search did not return any results. Please try again with other information.");
				return;
			}
		})
		.catch(function(error) {
			res.status(500).send("Internal server error. Please try later.")
			return;
		})
}

export function updateContactEmail(req, res) {

	if (req.body.userId == req.user.id) {
		let userId = req.user.id;
		let contactEmailUpdate = {
			'user_contact_email': req.body.contact_email
		}

		return service.updateRow("User", contactEmailUpdate, userId)
			.then(function(response) {
				return res.status(200).send({
					"message": "SUCCESS",
					"messageDetails": "Contact Email updated Successfully"
				});
			}).catch(function(err) {
				return res.status(500).send({
					"message": "ERROR",
					"messageDetails": "Contact Email updated UnSuccessfull with errors",
					"errorDescription": err
				});
			});
	} else {
		return res.status(400).send({
			"message": "ERROR",
			"messageDetails": "Bad Request, Not authorized to updated"
		});
	}

}

exports.authenticate = authenticate;