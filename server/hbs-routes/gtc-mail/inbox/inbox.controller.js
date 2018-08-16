'use strict';

'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const populate = require('../../../utilities/populate');
const vendorPlan = require('../../../config/gtc-plan');
const mailStatus = require('../../../config/mail-status');

export function inbox(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var offset, limit, field, order, page, includeArray = [];

	offset = 0;
	limit = null;
	field = "created_on";
	order = "desc";
	var mailModel = 'UserMail';

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : config.paginationLimit;
	delete req.query.limit;

	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;


	if (req.user)
		LoggedInUser = req.user;

	var user_id = LoggedInUser.id;

	var queryObj = {
		user_id: user_id,
		'$or': [
			{ mail_status: mailStatus["READ"] },
			{ mail_status: mailStatus["UNREAD"] }
		],
		status: statusCode["ACTIVE"],
	};

	async.series({
		cartCounts: function (callback) {
			service.cartHeader(LoggedInUser).then(function (response) {
				return callback(null, response);
			}).catch(function (error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		categories: function (callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			var categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = statusCode["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function (category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		inboxMail: function (callback) {

			includeArray = [
				{
					"model": model['Mail'],
					where: {
						status: statusCode["ACTIVE"],
						//to_id : user_id	
					},
					include: [{
						model: model['User'],
						as: 'fromUser',
						attributes: ['id', 'first_name']
					}],
				}];

			service.findRows(mailModel, queryObj, offset, limit, field, order, includeArray)
				.then(function (mail) {
					return callback(null, mail);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	},
		function (err, results) {
			if (!err) {
				var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
				var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
				res.render('gtc-mail/inbox', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cartheader: results.cartCounts,
					inboxMail: results.inboxMail.rows,
					mailStatus: mailStatus,
					collectionSize: results.inboxMail.count,
					page: page,
					pageSize: limit,
					maxSize: 5,
					selectedPage: 'inbox',
					vendorPlan: vendorPlan,
					dropDownUrl: dropDownUrl
				});
			} else {
				res.render('gtc-mail/inbox', err);
			}
		});
}


export function message(req, res) {
	var LoggedInUser = {}, queryObj = {}, bottomCategory = {}, mail_id;
	var includeArr = [], messageArr = [];
	var mailModal = "Mail";
	var messageUserModel = "UserMail";

	if (req.user)
		LoggedInUser = req.user;

	if (req.params.id)
		mail_id = req.params.id;

	messageArr = [
		{
			model: model['User'],
			as: 'fromUser',
			attributes: ['id', 'first_name']
		}];

	async.series({
		cartCounts: function (callback) {
			service.cartHeader(LoggedInUser).then(function (response) {
				return callback(null, response);
			}).catch(function (error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		categories: function (callback) {
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			var categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = statusCode["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function (category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		message: function (callback) {

			service.findIdRow(mailModal, mail_id, messageArr)
				.then(function (message) {
					return callback(null, message);
				})
				.catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				})
		},

		messageUserId: function (callback) {

			queryObj = {
				mail_id: req.params.id,
				user_id: req.user.id
			}
			service.findRow(messageUserModel, queryObj, [])
				.then(function (messageUser) {
					return callback(null, messageUser.id);
				})
				.catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				})
		}
	},
		function (err, results) {
			if (!err) {
				var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
				var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
				res.render('gtc-mail/messageView', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cartheader: results.cartCounts,
					message: results.message,
					messageUserId: results.messageUserId,
					selectedPage: 'inbox',
					vendorPlan: vendorPlan,
					dropDownUrl: dropDownUrl
				});
			} else {
				res.render('gtc-mail/messageView', err);
			}
		});
}


export function compose(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	async.series({
		cartCounts: function (callback) {
			service.cartHeader(LoggedInUser).then(function (response) {
				return callback(null, response);
			}).catch(function (error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		categories: function (callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			var categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = statusCode["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function (category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	},
		function (err, results) {
			if (!err) {
				var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
				var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
				res.render('gtc-mail/compose', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cartheader: results.cartCounts,
					selectedPage: 'inbox',
					vendorPlan: vendorPlan,
					dropDownUrl: dropDownUrl
				});
			} else {
				res.render('gtc-mail/compose', err);
			}
		});
}