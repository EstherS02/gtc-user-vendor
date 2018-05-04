'use strict';

const expressValidator = require('express-validator');
const config = require('../../config/environment');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');

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


function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}