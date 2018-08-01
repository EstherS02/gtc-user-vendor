'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');
const sendEmail = require('../../agenda/send-email');
const service = require('../service');
import moment from 'moment';

export function index(req, res) {
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
        attributes: {
            exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
        },
        order: [
            [field, order]
        ],
        raw: true
    }).then(function (rows) {
        if (rows.length > 0) {
            res.status(200).send(rows);
            return;
        } else {
            res.status(200).send(rows);
            return;
        }
    }).catch(function (error) {
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
        res.status(400).send('Missing Query Params');
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
    }).then(function (user) {
        if (user) {
            res.status(409).send("Email address already exists");
            return;
        } else {
            bodyParams['created_on'] = new Date();
            bodyParams["role"] = roles["USER"];
            bodyParams["status"] = status["ACTIVE"];

            model['User'].create(bodyParams)
                .then(function (userObj) {
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

                        service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
                            .then(function (response) {
                                if (response) {
                                    var username = user["first_name"];
                                    var email = user["email"];
                                    var subject = response.subject.replace('%USERNAME%', username);
                                    var body;
                                    body = response.body.replace('%USERNAME%', username);
                                    body = body.replace('%LINK%', config.baseUrl + '/user-verify?email=' + email + "&email_verified_token=" + email_verified_token);

                                    sendEmail({
                                        to: email,
                                        subject: subject,
                                        html: body
                                    });
                                    return res.status(201).send(user);
                                } else {
                                    return res.status(201).send(user);
                                }
                            }).catch(function (error) {
                                console.log('Error :::', error);
                                res.status(500).send("Internal server error");
                                return;
                            });
                    } else {
                        return res.status(400).send("Failed to create.");
                    }
                })
                .catch(function (error) {
                    console.log('Error :::', error);
                    res.status(500).send("Internal server error");
                    return;
                });
        }
    }).catch(function (error) {
        console.log('Error :::', error);
        res.status(500).send("Internal server error");
        return
    }); /**/
}

export function userAuthenticate(req, res) {
    var UserModel = "User";
    var includeArr = [];
    var queryObj = {};

    queryObj.email_verified_token = req.body.email_verified_token;
    queryObj.email = req.body.email;
    service.findOneRow(UserModel, queryObj, includeArr)
        .then(function (resp) {
            if (resp) {
                var expiryTime = moment(resp.email_verified_token_generated).add(24, 'hours').valueOf();
                var currentTime = moment().valueOf();
                if (currentTime < expiryTime) {
                    if (resp.email_verified == 0) {
                        var updateObj = {};
                        updateObj.email_verified = 1;
                        service.updateRow(UserModel, updateObj, resp.id)
                            .then(function (updateRsp) {
                                res.status(200).send("Email has been registered Successfully");
                                return;
                            })
                            .catch(function (err) {
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
        .catch(function (error) {
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
    }).then(function (row) {
        if (row > 0) {
            res.status(200).send("Users deleted successfully");
            return;
        } else {
            res.status(404).send("Cannot delete users");
            return
        }
    }).catch(function (error) {
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
        // console.log("hahi")
    }
    var errors = req.validationErrors();
    if (errors) {
        console.log("error", errors)
        res.status(400).send(errors);
        return;
    }
    var UserModel = "User";
    var userId = req.user.id;
    service.findIdRow(UserModel, userId, []).then(function (result) {
        if (authenticate(req.body.old_password, result)) {
            var saltWithEmail = new Buffer(result.salt + result.email.toString('base64'), 'base64');
            var hashedPassword = crypto.pbkdf2Sync(req.body.new_password, saltWithEmail, 10000, 64, 'sha1').toString('base64');
            var bodyParams = {
                hashed_pwd: hashedPassword
            };
            service.updateRow(UserModel, bodyParams, userId).then(function (response) {
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


export function userProfile(req, res) {

    var userUpdate = JSON.parse(req.body.userUpdate);
    var billingUpdate = JSON.parse(req.body.billingUpdate);
    var shippingUpdate = JSON.parse(req.body.shippingUpdate);
    var user_id = req.user.id;
    billingUpdate['user_id'] = req.user.id;
    billingUpdate['status'] = 1;
    shippingUpdate['user_id'] = req.user.id;
    shippingUpdate['status'] = 1;
    var billing_address_type = 1;
    var shipping_address_type = 2;

    service.updateRow('User', userUpdate, user_id)
        .then(function (row) {
            
            if(billingUpdate){
                addressUpdate(user_id, billing_address_type, billingUpdate);
            }
            if(shippingUpdate){
                addressUpdate(user_id, shipping_address_type, shippingUpdate);
            }
            return res.status(200).send(row);
        })
        .catch(function (err) {
            res.status(500).send(err);
            return;
        })
}

function addressUpdate(user_id, address_type, obj) {
    service.findRow('Address', {
        user_id: user_id,
        address_type: address_type
    }, [])
        .then(function (row) {
            if (row) {
                updateAddress(obj, row.id);
                return;
            }
            else {
                createAddress(obj);
                return;
            }
        }).catch(function (err) {
            return;
        })
}

function createAddress(obj) {
    service.createRow('Address', obj)
        .then(function (create) {
            return;
        }).catch(function (err) {
            return;
        })
}

function updateAddress(obj, id) {
    service.updateRow('Address', obj, id)
        .then(function (update) {
            return;
        }).catch(function (err) {
            return;
        })
}

export function vendorFollow(req, res) {
    var user_id = req.user.id;
    var vendor_id = req.body.vendor_id;
    var queryObj = {
        user_id: user_id,
        vendor_id: vendor_id
    };
    var modelName = "VendorFollower";
    model[modelName].findOne({
        where: queryObj
    }).then(function (result) {
        console.log("result", result.id);
        if (result) {
            var newStatus;
            if (result.status == 1) {
                newStatus = 0;
            } else {
                newStatus = 1;
            }
            model[modelName].update({
                status: newStatus,
                last_updated_on: new Date()
            }, {
                    where: {
                        id: result.id
                    }
                })
                .then(function (response) {
                    res.status(200).send(response);
                    return;
                });
        } else {
            var bodyParam = {};
            bodyParam.vendor_id = vendor_id;
            bodyParam.user_id = req.user.id;
            bodyParam.status = 1;
            bodyParam.created_on = new Date();
            service.createRow(modelName, bodyParam).then(function (response) {
                res.status(200).send(response);
                return;
            });
            // console.log(i, "not in db")
        }
    });
}

exports.authenticate = authenticate;