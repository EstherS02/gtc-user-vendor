'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');
const moment = require('moment');
const async = require('async');
const notifictionService = require('../../api/notification/notification.service');

export function faq(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};
	if (req.user)
		LoggedInUser = req.user;
	
	async.series({
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id, req, res)
					.then((cartResult) => {
						return callback(null, cartResult);
					}).catch((error) => {
						return callback(error);
					});
			} else {
				return callback(null);
			}
		},
		unreadCounts: function(callback) {
			notifictionService.notificationCounts(LoggedInUser.id)
				.then(function(counts) {
					return callback(null, counts);
				}).catch(function(error) {
					return callback(null);
				});
		}
	}, function(err, results) {
		if (!err) {
			res.render('faq', {
				title: "Global Trade Connect",
				unreadCounts: results.unreadCounts,
				cart: results.cartInfo,
				marketPlace: marketplace,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('faq', err);
		}
	});
}