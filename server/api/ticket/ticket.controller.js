'use strict';

const expressValidator = require('express-validator');
const config = require('../../config/environment');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');

const service = require('../service');
const model = require('../../sqldb/model-connect');

export function create(req, res) {

	var ticketBodyParams = {};
	var ticketThreadBodyParams = {};

	req.checkBody('title', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	if (req.body.message) {
		ticketThreadBodyParams.message = req.body.message;
		delete req.body.message;
	}

	ticketBodyParams = req.body;
	ticketBodyParams["user_id"] = req.user.id;
	ticketBodyParams["status"] = status["OPEN"];
	if (req.user.first_name && req.user.last_name) {
		ticketBodyParams["created_by"] = req.user.first_name + ' ' + req.user.last_name
	} else {
		ticketBodyParams["created_by"] = req.user.first_name
	}
	ticketBodyParams["created_on"] = new Date();

	model["Ticket"].create(ticketBodyParams)
		.then(function(ticket) {
			if (ticket) {
				var ticket = plainTextResponse(ticket);
				ticketThreadBodyParams["ticket_id"] = ticket.id;
				ticketThreadBodyParams["user_id"] = req.user.id;
				ticketThreadBodyParams["status"] = status["ACTIVE"];
				if (req.user.first_name && req.user.last_name) {
					ticketThreadBodyParams["created_by"] = req.user.first_name + ' ' + req.user.last_name
				} else {
					ticketThreadBodyParams["created_by"] = req.user.first_name
				}
				ticketThreadBodyParams["created_on"] = new Date();
				model["TicketThread"].create(ticketThreadBodyParams)
					.then(function(ticketThread) {
						if (ticketThread) {
							var ticketThread = plainTextResponse(ticketThread);
							return res.status(201).send(ticket);
						} else {
							return res.send(404).send("Unable to create ticket thread");
						}
					})
					.catch(function(error) {
						console.log('Error:::', error);
						return res.status(500).send("Internal server error");
					})
			} else {
				return res.status(404).send("Unable to create ticket");
			}
		})
		.catch(function(error) {
			console.log('Error:::', error);
			return res.status(500).send("Internal Server Error");
		});
}

export function update(req, res) {
	var paramsID = req.params.id;
	var bodyParams = req.body;

	service.findRow(req.endpoint, paramsID)
		.then(function(row) {
			if (row) {
				delete bodyParams["id"];

				if (req.user.first_name && req.user.last_name) {
					bodyParams["last_updated_by"] = req.user.first_name + ' ' + req.user.last_name
				} else {
					bodyParams["last_updated_by"] = req.user.first_name
				}
				bodyParams["last_updated_on"] = new Date();

				if (bodyParams["status"] == status["CLOSED"]) {
					if (req.user.first_name && req.user.last_name) {
						bodyParams["last_updated_by"] = req.user.first_name + ' ' + req.user.last_name
					} else {
						bodyParams["last_updated_by"] = req.user.first_name
					}
					bodyParams["closed_date"] = new Date();
				}

				service.updateRow(req.endpoint, bodyParams, paramsID)
					.then(function(result) {
						if (result) {
							return res.status(200).send(result);
						} else {
							return res.status(404).send("Unable to update");
						}
					}).catch(function(error) {
						console.log('Error :::', error);
						res.status(500).send("Internal server error");
						return
					});
			} else {
				return res.status(404).send("Tickets not found");
			}
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}


function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}