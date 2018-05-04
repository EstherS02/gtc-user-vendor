'use strict';

const expressValidator = require('express-validator');
const config = require('../../config/environment');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');

const model = require('../../sqldb/model-connect');

export function createTicketThread(req, res) {
	var bodyParams = {};
	var ticketID = req.params.ticket_id;

	bodyParams["user_id"] = req.user.id;
	if (req.body.message) {
		bodyParams["message"] = req.body.message;
	}
	bodyParams["status"] = status["ACTIVE"];
	if (req.user.first_name && req.user.last_name) {
		bodyParams["created_by"] = req.user.first_name + ' ' + req.user.last_name
	} else {
		bodyParams["created_by"] = req.user.first_name
	}
	bodyParams["created_on"] = new Date();

	model["Ticket"].findById(ticketID).then(function(ticket) {
		if (ticket) {
			if (ticket.status == status["CLOSED"]) {
				return res.status(200).send("Ticket already closed");
			} else {
				bodyParams["ticket_id"] = ticket.id;
				model["TicketThread"].create(bodyParams)
					.then(function(thread) {
						if (thread) {
							var thread = plainTextResponse(thread);
							return res.status(201).send(thread);
						} else {
							return res.status(404).send("Unable to create thread");
						}
					})
					.catch(function(error) {
						console.log('Error:::', error);
						return res.status(500).send("Internal server error");
					});
			}
		} else {
			return res.status(404).send("Ticket not found");
		}
	}).catch(function(error) {
		console.log("Error:::", error);
		return res.status(500).send("Internal server error");
	});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}