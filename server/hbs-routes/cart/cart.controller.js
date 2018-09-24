'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const cartObj = require('../../api/cart/cart.controller');
const populate = require('../../utilities/populate');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');

export function cart(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	if (req.user)
		LoggedInUser = req.user;

	async.series({
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id)
					.then((cartResult) => {
						return callback(null, cartResult);
					}).catch((error) => {
						return callback(error);
					});
			} else {
				return callback(null);
			}
		},
		categories: function(cb) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			var categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return cb(null, category.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return cb(null);
				});
		}
	}, function(err, results) {
		if (!err) {
			return res.render('cart', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				marketPlace: marketplace
			});
		} else {
			console.log(err)
			return res.status(500).render(err);
		}
	});
}