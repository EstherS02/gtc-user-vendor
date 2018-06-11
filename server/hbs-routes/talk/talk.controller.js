'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const dayCode = require('../../config/days');
const position = require('../../config/position');
const service = require('../../api/service');
const async = require('async');

export function talk(req, res) {
	var modelName = 'TalkSetting';
	var timeModel = "Timezone";
	var queryObj1 = {};
	var queryObj = {
		vendor_id: 29
	};
	var includeArr = [];

	async.series({
		talk: function(callback) {
			service.findOneRow(modelName, queryObj, includeArr)
				.then(function(talkSetting) {
					return callback(null, talkSetting);
				})
				.catch(function(error) {
					consolelog('Error:::', error);
					return callback(error, null);
				})
		},
		busiHours: function(callback) {
			var includeArr1 = [{
				model: model['Timezone']
			}];
			service.findAllRows("BusinessHour", includeArr1, queryObj, 0, null, "id", "asc")
				.then(function(busiHours) {
					return callback(null, busiHours.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				})
		},
		timeZone: function(callback) {
			service.findAllRows(timeModel, includeArr, queryObj1, 0, null, "id", "asc")
				.then(function(timeZone) {
					return callback(null, timeZone.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				})
		}
	}, function(error, results) {
		if (!error) {
			console.log('results', results);
			res.render('talk', {
				title: "Global Trade Connect",
				talk: results.talk,
				busiHours: results.busiHours,
				timeZone: results.timeZone,
				dayCode: dayCode
			});
		} else {
			res.render('services', error);
		}
	});
}