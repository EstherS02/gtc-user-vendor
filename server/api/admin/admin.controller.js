'use strict';

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
    // model['Admin'].findAll({
    //     include: includeArr,
    //     where: queryObj,
    //     offset: offset,
    //     limit: limit,
    //     order: [
    //         [field, order]
    //     ]
    // }).then(function(rows) {
    //     if (rows.length > 0) {
    //         model['Admin'].count({
    //             where: queryObj
    //         }).then(function(count) {
    //             result.count = count;
    //             result.rows = rows;
    //             return res.status(200).send(result);
    //         }).catch(function(error) {
    //             console.log("Error:::", error);
    //             return res.status(500).send("Internal server error.");
    //         });
    //     } else {
    //         result.count = 0;
    //         result.rows = rows;
    //         return res.status(200).send(result);
    //     }
    // }).catch(function(error) {
    //     console.log("Error:::", error);
    //     return res.status(500).send("Internal server error.");
    // });
}

export function deleteAll(req, res) {
    var existsTable = [];
    var deleteTable = [];
    var userTable = [];
    var vendorModel = 'Admin';
    var userModel = 'User';
    var ids = JSON.parse(req.body.ids);//[3,4]; //
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
            for (var i = 0; i < response.length; i++) {
                if (response[i]) {
                    queryObj['id'] = response[i]['id'];
                    userQueryObj['id'] = response[i]['user_id'];
                    deleteTable.push(service.updateRecord(vendorModel, {
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
            });
            return res.status(200).send(returnResponse);

        } else {
             return res.status(500).send("No data found.");
        }
    });
}

export function create(req, res) {

    var queryObj = {};

    req.checkBody('email', 'Missing Query Param').notEmpty();
    req.checkBody('email', 'Please enter a valid email address').isEmail();
    req.checkBody('email', 'Email Address lowercase letters only').isLowercase();
    req.checkBody('password', 'Missing Query Param').notEmpty();
    req.checkBody('first_name', 'Missing Query Param').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send('Missing Query Params');
        return;
    }

    req.body.salt = makeSalt();
    req.body.hashed_pwd = encryptPassword(req);

    if (req.body.email) {
        queryObj['email'] = req.body.email;
    }
    const bodyParams = req.body;

    model['User'].findOne({
        where: queryObj
    }).then(function(user) {
        if (user) {
            res.status(409).send("Email address already exists");
            return;
        } else {
            bodyParams["provider"] = providers["OWN"];
            bodyParams["contact_email"] = req.body.email;
            bodyParams["status"] = status["ACTIVE"];
            bodyParams["role"] = roles["ADMIN"];
            bodyParams["email_verified"] = 1;
            bodyParams['created_on'] = new Date();

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
                            });
                    } else {
                        res.status(404).send("Not found");
                        return;
                    }
                }).catch(function(error) {
                    console.log('Error :::', error);
                    res.status(500).send("Internal server error");
                    return;
                });
        }
    }).catch(function(error) {
        res.status(500).send("Internal server error");
        return;
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
    var adminID = req.params.id,
        userID;
    var userModel = 'User';
    var adminModel = 'Admin';
    var bodyParam = {};

    req.checkBody('first_name', 'Missing first name').notEmpty();
    req.checkBody('email', 'Missing email address').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        console.log("Error::", errors)
        return res.status(400).send({
            "message": "Error",
            "messageDetails": error
        });
    }

    bodyParam = req.body;

    try {

        const existingAdmin = await service.findIdRow(adminModel, adminID);
        if (existingAdmin) {

            userID = existingAdmin.user_id;
            const existingUser = await service.findIdRow(userModel, userID);
            if (existingUser) {
                const User = await service.updateRecordNew(userModel, bodyParam, {
                    id: userID
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