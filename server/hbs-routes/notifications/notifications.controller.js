'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
var async = require('async');

export function notifications(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	//pagination 
	var page;
	var offset;
	var limit;
	var order;
	var field;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	delete req.query.order;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;
	// End pagination

	model["VendorUserProduct"].find({
		where: 29
	}).then(function(row) {
		if (row.marketplace_id) {
			if (row.marketplace_id == 1) {
				var obj = {
					visible_to_wholesaler: 1
				}
			}
			if (row.marketplace_id == 2) {
				var obj = {
					visible_to_retailer: 1
				}
			}
			if (row.marketplace_id == 4) {
				var obj = {
					visible_to_lifestyle_provider: 1
				}
			}
			if (row.marketplace_id == 3) {
				var obj = {
					visible_to_service_provider: 1
				}
			}
			model["Announcement"].findAndCountAll({
				where: obj,
				offset: offset,
				limit: limit,
				order: [
					[field, order]
				],
				raw: true
			}).then(function(results) {
				maxSize = results.count/limit;
				if (results) {
					res.render('notifications', {
						title: 'Global Trade Connect',
						Announcements: results.rows,
						statusCode: statusCode,
						LoggedInUser: LoggedInUser,
						// pagination
						page: page,
						maxSize: maxSize,
						pageSize: limit,
						collectionSize: results.count
						// End pagination
					});
					return;
				} else {
					res.status(404).send("Not Found");
					return;
				}
			}).catch(function(error) {
				if (error) {
					res.status(500).send(error);
					return;
				}
			})
		} else {
			res.status(404).send("Not Found");
			return;
		}
	}).catch(function(error) {
		if (error) {
			res.status(500).send(error);
			return;
		}
	})
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}