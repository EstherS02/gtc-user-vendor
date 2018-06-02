'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const dayCode = require('../../config/days');
const timeNow = require('../../config/time');
const position = require('../../config/position');
const service = require('../../api/service');
const async = require('async');

export function talk(req,res) {
	var modelName = 'TalkSetting';
	var timeModel = "Timezone";
	var queryObj1 = {};
	var queryObj = {
		vendor_id : 29
	};
	var includeArr = [];
	async.series({
		talk: function(callback) {
			service.findOneRow(modelName, queryObj, includeArr)
				.then(function(talk) {
					return callback(null, talk);
				}).catch(function(error) {
					console.log('Error:::', error);
					return callback(null);
				});
		},
		timeZone: function(callback) {
			model[timeModel].findAll({
			raw: true
		}).then(function(rows) {
			// resolve(rows);
			return callback(null, rows);
		}).catch(function(error) {
			// reject(error);
		});
		}
	}, function(error, results) {
		if (!error) {
			console.log('results', results);
			res.render('talk', {
				title: "Global Trade Connect",
				talk: results.talk,
				timeZone:results.timeZone,
				dayCode :dayCode,
				timeNow :timeNow
			});
		} else {
			res.render('services', error);
		}
	});
	// res.render('talk', {
	// 			title: "Global Trade Connect",
	// 			dayCode :dayCode,
	// 			timeNow :timeNow
	// 		});
}

