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
				raw: true
			}).then(function(results) {
				if (results) {
					res.render('notifications', {
						title: 'Global Trade Connect',
						Announcements: results.rows,
						statusCode: statusCode,
						LoggedInUser: LoggedInUser
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