'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');

export function listings(req, res) {

	var offset, limit, field, order,page;
	var queryParams = {}, LoggedInUser = {};
	var productModel = "MarketplaceProduct";
	queryParams["vendor_id"] =28;
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

	if(req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
	LoggedInUser = req.gtcGlobalUserObj;
	
	let user_id = LoggedInUser.id;


	if (req.query.product_name) {
           queryParams['product_name'] = req.query.product_name;
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
	}, function (err, results) {
		if (!err) {
			res.render('view-listings', {
				title: "Global Trade Connect",
				products: results.products.rows,
				collectionSize: results.products.count,
				page: page,
				pageSize: limit,
				offset: offset,
				maxSize: 5,
				statusCode: status,
				LoggedInUser: LoggedInUser
			});
		}
		else {
			res.render('view-listings', err);
		}
	});
}

export function editListings(req, res) {

	let searchObj = {}
	var productModel = "MarketplaceProduct";

    if(req.params.product_slug)
        searchObj["product_slug"] = req.params.product_slug;    

    service.findOneRow(productModel, searchObj)
        .then(function (product) {
            res.render('edit-listing', {
				title: 'Global Trade Connect',
				statusCode: status,
                product : product
            });
        }).catch(function (error) {
            console.log('Error :::', error);
            res.render('edit-listing', error)
        });
}


