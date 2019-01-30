'use strict';

const mv = require('mv');
const path = require('path');
const crypto = require('crypto');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');
const Sequelize = require('sequelize');
const service = require('../service');


export function index(req, res) {

    var result = {},
        queryObj = {},
        userQueryObj = {};
    var includeArr = [];
    var offset, limit, field, order;

    offset = req.query.offset ? parseInt(req.query.offset) : 0;
    delete req.query.offset;
    limit = req.query.limit ? parseInt(req.query.limit) : 10;
    delete req.query.limit;
    field = req.query.field ? req.query.field : "id";
    delete req.query.field;
    order = req.query.order ? req.query.order : "asc";
    delete req.query.order;

    if (req.query.status)
        queryObj['status'] = req.query.status
    else {
        queryObj['status'] = {
            '$ne': status["DELETED"]
        }
    }
    userQueryObj['role'] = roles['ADMIN'];

    if (req.query.text) {
        userQueryObj['$or'] = [
            Sequelize.where(Sequelize.fn('concat_ws', Sequelize.col('first_name'), ' ', Sequelize.col('last_name')), {
                $like: '%' + req.query.text + '%'
            })
        ]
    }

    includeArr = [{
        model: model["User"],
        attributes: ['id', 'first_name', 'last_name', 'email', 'status'],
        where: userQueryObj
    }];
    service.findRows('Admin', queryObj, offset, limit, field, order, includeArr)
    .then(function(products){
        return res.status(200).send(products);
    }).catch(function(error){
        return res.status(500).send({
            "message": "ERROR",
            "messageDetails": "Unable to display Administrator.",
            "errorDescription": error
        });
    })
}

export function deleteAdmin(req, res) {

    var existsTable = [];
    var deleteTable = [];
    var userTable = [];
    var adminModel = 'Admin';
    var userModel = 'User';
    var ids = JSON.parse(req.body.ids);
    var returnResponse = [];
    var userQueryObj = {};
    var queryObj = {};

    for (let i = 0; i < ids.length; i++) {
        queryObj['id'] = ids[i];
        existsTable.push(service.findOneRow(adminModel, queryObj, []))
    }
    Promise.all(existsTable).then((response) => {
        if (response.length > 0) {

            for (var i = 0; i < response.length; i++) {
                if (response[i]) {
                    queryObj['id'] = response[i]['id'];
					userQueryObj['id'] = response[i]['user_id'];

                    deleteTable.push(service.updateRecord(adminModel, {
                        status: status['DELETED']
                    }, queryObj));
                    userTable.push(service.updateRecord(userModel, {
                        status: status['DELETED']
                    }, userQueryObj));
                }
            }

            Promise.all(deleteTable).then((response) => {
                returnResponse.push(response);
            });
            Promise.all(userTable).then((response) => {
                returnResponse.push(response);
                returnResponse.push(response);
            });
            return res.status(200).send(returnResponse);

        } else {
             return res.status(500).send("No data found.");
        }
    });
}

export async function create(req, res) {

    var queryObj = {};

    req.checkBody('email', 'Email is missing').notEmpty();
    req.checkBody('email', 'Invalid email address').isEmail();
    req.checkBody('email', 'Email Address should be in lowercase only').isLowercase();
    req.checkBody('password', 'Password is missing.').notEmpty();
    req.checkBody('first_name', 'First name is missing.').notEmpty();

	var errors = req.validationErrors();
	
    if (errors) {
		console.log("Error::", errors)
		return res.status(400).send({
			"message": "Error",
			"messageDetails": errors[0].msg
		});
    }

    req.body.salt = makeSalt();
    req.body.hashed_pwd = encryptPassword(req);

    if (req.body.email) {
        queryObj['email'] = req.body.email;
	}
	
    const bodyParams = req.body;

    model['User'].findOne({
        where: queryObj
    }).then(async function(user) {
        if (user) {
			return res.status(409).send({
				"message": "Error",
				"messageDetails": "Email address already exists."
			});
        } else {

            bodyParams["provider"] = providers["OWN"];
            bodyParams["user_contact_email"] = req.body.email;
            bodyParams["status"] = status["ACTIVE"];
            bodyParams["role"] = roles["ADMIN"];
            bodyParams["email_verified"] = 1;
            bodyParams['created_on'] = new Date();
            if (req.files.admin_profile_pic) {

                const userProfilePicture = req.files.admin_profile_pic;
                const parsedFile = path.parse(userProfilePicture.originalFilename);
                const timeInMilliSeconds = new Date().getTime();
                const uploadPath = config.images_base_path + "/user/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

                const userProfilePictureUpload = await move(userProfilePicture.path, uploadPath);
                if (userProfilePictureUpload) {
                    bodyParams['user_pic_url'] = config.imageUrlRewritePath.base + "user/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
                }
			}

            model['User'].create(bodyParams)
                .then(function(user) {
                    if (user) {
                        var rspUser = user.toJSON();
                        var adminBodyParams = {};

                        adminBodyParams['user_id'] = rspUser.id;
                        adminBodyParams['status'] = status["ACTIVE"];
                        adminBodyParams['created_on'] = new Date();

                        model['Admin'].create(adminBodyParams)
                            .then(function(admin) {
                                if (admin) {	
                                    delete rspUser.salt;
                                    delete rspUser.hashed_pwd;
                                    return res.status(201).send({
										"message": "Success",
										"messageDetails": "Admin Created Successfully."
									});
                                } else {
                                    return res.status(404).send({
										"message": "Error",
										"messageDetails": "Admin Not Found."
									});
                                }
                            }).catch(function(error) {
                                console.log('Error :::', error);
                                return res.status(500).send({
									"message": "Error",
									"messageDetails": "Internal Server Error"
								});
                            });
                    } else {
                        return res.status(404).send({
							"message": "Error",
							"messageDetails": "Admin Not Found."
						});
                    }
                }).catch(function(error) {
                    console.log('Error :::', error);
					return res.status(500).send({
						"message": "Error",
						"messageDetails": "Internal Server Error"
					});
                });
        }
    }).catch(function(error) {
        console.log('Error :::', error);
		return res.status(500).send({
			"message": "Error",
			"messageDetails": "Internal Server Error"
		});
    });
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

function authenticate(plainText, admin) {
    var customBody = {
        body: {
            password: plainText,
            salt: admin.salt,
            email: admin.email
        }
    };
    return encryptPassword(customBody) == admin.hashed_pwd;
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

export async function edit(req, res) {

    var adminID = req.params.id, userID;
    var userModel = 'User';
    var adminModel = 'Admin';
    var userBodyParam = {}, adminBodyParam = {};

    req.checkBody('first_name', 'Missing first name').notEmpty();
	req.checkBody('email', 'Missing email address').notEmpty();
	req.checkBody('status', 'Missing admin status').notEmpty();

	delete req.body.password;

    var errors = req.validationErrors();
    if (errors) {
        console.log("Error::", errors)
        return res.status(400).send({
            "message": "Error",
            "messageDetails": errors[0].msg
        });
	}
	
	userBodyParam = req.body;
	userBodyParam['last_updated_by'] = req.user.first_name;
	userBodyParam['last_updated_on'] = new Date();
	adminBodyParam['status'] = req.body.status; 
	adminBodyParam['last_updated_by'] = req.user.first_name;
	adminBodyParam['last_updated_on'] = new Date();

    try {
         if (req.files.admin_profile_pic) {
                const userProfilePicture = req.files.admin_profile_pic;
                const parsedFile = path.parse(userProfilePicture.originalFilename);
                const timeInMilliSeconds = new Date().getTime();
                const uploadPath = config.images_base_path + "/user/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

                const userProfilePictureUpload = await move(userProfilePicture.path, uploadPath);
                if (userProfilePictureUpload) {
                    userBodyParam['user_pic_url'] = config.imageUrlRewritePath.base + "user/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
                }
			}
			
        const existingAdmin = await service.findIdRow(adminModel, adminID);
        if (existingAdmin) {

            userID = existingAdmin.user_id;
            const existingUser = await service.findIdRow(userModel, userID);
            if (existingUser) {
                const User = await service.updateRecordNew(userModel, userBodyParam, {
                    id: userID
				});

				const Admin = await service.updateRecordNew(adminModel, adminBodyParam, {
                    id: existingAdmin.id
				});				
						
                return res.status(200).send({
                    "message": "Success",
                    "messageDetails": "Admin details updated successfully."
                });
            } else {
                return res.status(400).send({
                    "message": "Error",
                    "messageDetails": "Admin not Found."
                });
            }
        } else {
            return res.status(400).send({
                "message": "Error",
                "messageDetails": "Admin not Found."
            });
        }

    } catch (error) {
        console.log("Error::", error);
        return res.status(500).send({
            "message": "Error",
            "messageDetails": "Internal Server Error."
        });
    }
}

exports.authenticate = authenticate;