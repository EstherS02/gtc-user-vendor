'use strict';

const fs = require('fs');
const path = require('path');
const async = require('async');
const _ = require('lodash');
const moment = require('moment');
const service = require('../service');
const roles = require('../../config/roles');
const status = require('../../config/status');
const mailService = require('./mail.service');
const provider = require('../../config/providers');
const config = require('../../config/environment');
const mailStatus = require('../../config/mail-status');
const model = require('../../sqldb/model-connect');

export function create(req, res) {
	var mailUser = [];
	var queryObj = {};
	var bodyParams = {};
	var validUsers = [];
	var currentUser = req.user;

	var to = JSON.parse(req.body.to);

	delete req.body.to;
	req.body.to = to;
	
	if (currentUser.provider != provider['OWN']) {
		return res.status(400).send("This provider not allow");
	}

	req.checkBody('subject', 'Missing Query Param').notEmpty();
	if (!req.body.to || req.body.to.length == 0) {
		return res.status(400).send('Missing Query Params');
	}

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');;
		return;
	}

	mailUser = _.uniqBy(req.body.to);
	bodyParams = req.body;
	if (bodyParams.to) {
		delete bodyParams.to;
	}
	bodyParams['from_id'] = currentUser.id;
	bodyParams['status'] = status['ACTIVE'];
	bodyParams['created_on'] = new Date();
	bodyParams['created_by'] = currentUser.first_name;

	if (currentUser['role'] == roles['USER']) {
		if (mailUser.length != 1) {
			return res.status(400).send("Email restricted to only one vendor");
		}
		queryObj['role'] = roles['VENDOR'];
	} /* else {
		queryObj['role'] = roles['USER'];
	} */

	for (var i = 0; i < mailUser.length; i++) {
		var model = 'User';
		var includeArr = [];
		queryObj['id'] = mailUser[i];
		queryObj['provider'] = provider['OWN'];

		validUsers.push(service.findOneRow(model, queryObj, includeArr))
	}

	return Promise.all(validUsers)
		.then((users) => {
			if (!users) {
				return res.status(404).send("Users not found");
			} else {
				return mailService.createMail(bodyParams, users)
			}
		}).then((response) => {
			return res.status(200).send(response);
		}).catch((error) => {
			console.log("Error:::", error);
			return res.status(500).send("Internal server error.");
		});
}

export function createDraf(req, res) {
	var bodyParams = {};
	var currentUser = req.user;

	req.checkBody('subject', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');;
		return;
	}

	bodyParams = req.body;

	if (bodyParams.to) {
		delete bodyParams.to;
	}

	bodyParams['from_id'] = currentUser.id;
	bodyParams['status'] = status['ACTIVE'];
	bodyParams['created_on'] = new Date();
	bodyParams['created_by'] = currentUser.first_name;

	mailService.drafMail(bodyParams)
		.then((response) => {
			return res.status(200).send(response);
		})
		.catch((error) => {
			console.log("Error:::", error);
			return res.status(500).send("Internal server error");
		})
}

export function softDelete(req, res) {
	var queryObj = {};

	queryObj['id'] = req.params.id;
	queryObj['status'] = status['ACTIVE'];
	queryObj['user_id'] = req.user.id;
	queryObj['$or'] = [{
		mail_status: mailStatus['READ']
	}, {
		mail_status: mailStatus['UNREAD']
	}];

	mailService.deleteMail(queryObj)
		.then((response) => {
			if (response) {
				return res.status(200).send("Mail deleted successfully.");
			} else {
				return res.status(404).send("not found");
			}
		})
		.catch((error) => {
			console.log("Error:::", error);
			return res.status(500).send("Internal server error");
		});
}

export function remove(req, res) {
	var queryObj = {};

	queryObj['id'] = req.params.id;
	queryObj['status'] = status['ACTIVE'];
	queryObj['user_id'] = req.user.id;
	queryObj['$or'] = [{
		mail_status: mailStatus['SENT']
	}, {
		mail_status: mailStatus['DRAFT']
	}, {
		mail_status: mailStatus['DELETED']
	}];

	mailService.removeMail(queryObj)
		.then((response) => {
			if (response) {
				return res.status(200).send("Mail deleted successfully.");
			} else {
				return res.status(404).send("not found");
			}
		})
		.catch((error) => {
			console.log("Error:::", error);
			return res.status(500).send("Internal server error");
		});
}

export function autoCompleteFirstName(req,res){
	 var queryObj = {}, includeArr=[];

	if (req.query.keyword) {
		queryObj['first_name'] = {
			like: '%' + req.query.keyword + '%'
		};
	}
	model['User'].findAll({
        where: queryObj,
        attributes: ['id', 'first_name'],
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
        res.status(500).send("Internal server error");
        return;
    })
}