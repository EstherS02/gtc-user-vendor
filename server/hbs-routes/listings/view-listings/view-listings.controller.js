'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const populate = require('../../../utilities/populate');
const vendorPlan = require('../../../config/gtc-plan');
var url = require('url');

export function viewListings(req, res) {

	var offset, limit, field, order, page, type;
	var queryParams = {}, LoggedInUser = {};
	var productModel = "MarketplaceProduct";
	field = "id";
	order = "asc";
	offset = 0;

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : config.paginationLimit;
	delete req.query.limit;

	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;

	if (req.user)
		LoggedInUser = req.user;

	queryParams['vendor_id'] = LoggedInUser.Vendor.id;

	type = req.params.type;


	if (req.params.type == 'wholesale') {
		queryParams["marketplace_id"] = 1;
		type = 'wholesale';
	}

	if (req.params.type == 'shop') {
		queryParams["marketplace_id"] = 2;
	}

	if (req.params.type == 'services') {
		queryParams["marketplace_id"] = 3;
	}

	if (req.params.type == 'lifestyle') {
		queryParams["marketplace_id"] = 4;
	}

	if (req.query.keyword) {
		queryParams['product_name'] = {
			like: '%' + req.query.keyword + '%'
		};
	}

	if (req.query.status) {
		if (req.query.status == 'ACTIVE')
			queryParams['status'] = status[req.query.status];
		if (req.query.status == 'INACTIVE')
			queryParams['status'] = status[req.query.status];
		if (req.query.status == 'SUSPENDED')
			queryParams['status'] = status[req.query.status];
		if (req.query.status == 'SOLDOUT')
			queryParams['status'] = status[req.query.status];
	}
	else {
		queryParams['status'] = {
			'$ne': status["DELETED"]
		}
	}
	console.log(queryParams)
	async.series({
		products: function (callback) {

			service.findRows(productModel, queryParams, offset, limit, field, order)
				.then(function (products) {
					return callback(null, products);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		category: function(callback) {
                service.findRows("Category", {}, 0, null, 'id', 'asc')
                    .then(function(category) {
                        return callback(null, category.rows);

                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(null);
                    });
            }
	}, function (err, results) {
		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url,'').replace(req.protocol + '://' + req.get('host'),'').replace('/','').trim();

		if (!err) {
			res.render('listings/view-listings', {
				title: "Global Trade Connect",
				products: results.products.rows,
				collectionSize: results.products.count,
				category:results.category,
				page: page,
				pageSize: limit,
				offset: offset,
				maxSize: 5,
				statusCode: status,
				LoggedInUser: LoggedInUser,
				type: type,
				selectedPage: type,
				vendorPlan:vendorPlan,
				dropDownUrl:dropDownUrl
			});
		}
		else {
			res.render('view-listings', err);
		}
	});
}