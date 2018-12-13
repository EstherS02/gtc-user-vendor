'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const statusCode = require('../../../config/status');
const productService = require('../../../api/product/product.service');
const populate = require('../../../utilities/populate');
const service = require('../../../api/service');
const cartService = require('../../../api/cart/cart.service');
const marketplace = require('../../../config/marketplace');
const moment = require('moment');
const async = require('async');
const vendorPlan = require('../../../config/gtc-plan');
const notifictionService = require('../../../api/notification/notification.service');
const querystring = require('querystring');

export function viewTicket(req, res) {
	var LoggedInUser = {} ,queryURI = {},queryObj ={},queryPaginationObj = {}, queryParams = {};
	if (req.user)
		LoggedInUser = req.user;

	var originalUrl = req.originalUrl.split('?')[0];

	let user_id = LoggedInUser.id;
	if (req.query.sort == 'rating') {
		var field = req.query.sort;
		queryPaginationObj["field"] = field;
	} else {
		var field = 'id';
		queryPaginationObj["field"] = field;
	}

	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	var vendor_id;
	if (LoggedInUser.Vendor)
		vendor_id = LoggedInUser.Vendor.id;
	//pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;

	// End pagination
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var dropDownUrl = fullUrl.replace(req.protocol + '://' + req.get('host'), '').replace('/', '');

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
		ticketListing: function(callback) {
			var includeArr = [];
		     queryObj = {
				user_id: user_id
			}
			var field = "id";
			var order = "desc";
			var limit = null;
			service.findAllRows('Ticket', includeArr, queryObj, 0, limit, field, order).
			then(function(ticketListing) {
				var ticketListing = ticketListing;
				return callback(null, ticketListing);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
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
			maxSize = results.ticketListing.count / limit;
			if (results.ticketListing.count % limit)
				maxSize++;

			queryPaginationObj['maxSize'] = maxSize;
			res.render('vendorNav/support/ticket/view-ticket', {
				title: "Global Trade Connect",
				ticketListing:results.ticketListing,
				unreadCounts: results.unreadCounts,
				cart: results.cartInfo,
				queryURI: queryURI,
				queryParamsString: querystring.stringify(queryURI),
				pageSize: limit,
				offset: offset,
				maxSize: 5,
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				queryPaginationObj: queryPaginationObj,
				statusCode: statusCode,
				selectedPage: 'view-ticket',
				originalUrl:originalUrl
			});
		} else {
			res.render('vendorNav/support/ticket/view-ticket', err);
		}
	});
}
export function createTicket(req, res) {
	var LoggedInUser = {};
	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var queryPaginationObj = {};
	if (req.query.sort == 'rating') {
		var field = req.query.sort;
		queryPaginationObj["field"] = field;
	} else {
		var field = 'id';
		queryPaginationObj["field"] = field;
	}

	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	var vendor_id;
	if (LoggedInUser.Vendor)
		vendor_id = LoggedInUser.Vendor.id;

	

	//pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 5;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";

	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;
	// End pagination
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var dropDownUrl = fullUrl.replace(req.protocol + '://' + req.get('host'), '').replace('/', '');

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
			res.render('vendorNav/support/ticket/create-ticket', {
				title: "Global Trade Connect",
				unreadCounts: results.unreadCounts,
				cart: results.cartInfo,
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				selectedPage: 'create-ticket'
			});
		} else {
			res.render('create-ticket', err);
		}
	});
}
export function updateTicket(req, res) {
	var LoggedInUser = {};
	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	var vendor_id;
	if (LoggedInUser.Vendor)
		vendor_id = LoggedInUser.Vendor.id;
    var ticket_id =req.params.id;
	
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var dropDownUrl = fullUrl.replace(req.protocol + '://' + req.get('host'), '').replace('/', '');

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
		ticketListing: function(callback) {
			var includeArr = [{
				model: model['User'],
				attributes: ['id','role','first_name','last_name'],
				
			}];
			var queryObj = {
				ticket_id: ticket_id
			}
			var field = "id";
			var order = "ASC";
			var limit = null;
			service.findAllRows('TicketThread', includeArr, queryObj, 0, limit, field, order).
			then(function(ticketListing) {
				var ticketListing = ticketListing;
				return callback(null, ticketListing);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		ticketdetails: function(callback) {
			var includeArr = [];
			var ticketObj = {
				id: ticket_id
			}
			var field = "id";
			var order = "desc";
			var limit = 1;
			service.findAllRows('Ticket', includeArr, ticketObj, 0, limit, field, order).
			then(function(ticketdetails) {
				var ticketdetails = ticketdetails;
				return callback(null, ticketdetails);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
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
			res.render('vendorNav/support/ticket/ticket-detail', {
				title: "Global Trade Connect",
				unreadCounts: results.unreadCounts,
				cart: results.cartInfo,
				ticketListing:results.ticketListing,
				ticketdetails:results.ticketdetails,
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				selectedPage: 'ticket-detail'
			});
		} else {
			res.render('ticket-detail', err);
		}
	});
}