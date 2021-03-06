'use strict';

const service = require('../../api/service');
const status = require('../../config/status');

export function login(req, res) {
	var bottomCategory = {};
	var categoryModel = "Category";
	var LoggedInUser = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}

	if (req.currentUser) {
		res.redirect('/')
	} else {
		var includeArr = [];
		const categoryOffset = 0;
		const categoryLimit = null;
		const categoryField = "id";
		const categoryOrder = "asc";
		const categoryQueryObj = {};

		categoryQueryObj['status'] = status["ACTIVE"];

		service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
			.then(function(category) {
				var categories = category.rows;
				bottomCategory['left'] = categories.slice(0, 8);
				bottomCategory['right'] = categories.slice(8, 16);
				res.render('login', {
					title: "Global Trade Connect",
					bottomCategory: bottomCategory,
					LoggedInUser: LoggedInUser
				});
			}).catch(function(error) {
				res.render('login', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser
				});
			});
	}
}