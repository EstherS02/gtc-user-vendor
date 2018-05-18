'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
import series from 'async/series';
var async = require('async');


export function notifications(req, res) {

	var field = "id";
	var order = "asc";
	var offset = 0;
	var limit = 5;
	async.series({
		Announcements: function(callback) {

			service.findRows('Announcement', {}, offset, limit, field, order)
				.then(function(Announcements) {
					// console.log('Announcements', Announcements);

					return callback(null, Announcements.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}

	}, function(err, results) {
		if (!err) {
			res.render('notifications', results);
		} else {
			res.render('notifications', err);
		}
	});
	// res.render('notifications', {
	//        title: 'Global Trade Connect'
	//    });

}