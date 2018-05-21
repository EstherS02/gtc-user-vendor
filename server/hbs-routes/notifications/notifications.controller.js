'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
import series from 'async/series';
var async = require('async');


// export function notifications(req, res) {

// 	var field = "id";
// 	var order = "asc";
// 	var offset = 0;
// 	var limit = 10;
// 	async.series({
// 		Announcements: function(callback) {

// 			service.findRows('Announcement', {}, offset, limit, field, order)
// 				.then(function(Announcements) {
// 					console.log('Announcements', Announcements);

// 					return callback(null, Announcements.rows);
// 				}).catch(function(error) {
// 					console.log('Error :::', error);
// 					return callback(null);
// 				});
// 		}

// 	}, function(err, results) {
// 		if (!err) {
// 			res.render('notifications', results);
// 		} else {
// 			res.render('notifications', err);
// 		}
// 	});
// }
export function notifications(req, res) {

	model["VendorUserProduct"].find({
		where: 29
	}).then(function(row) {
		if (row.marketplace_id) {
			console.log(row);
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
						Announcements: results.rows
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