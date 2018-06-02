'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');

export function listings(req, res) {

	var offset, limit, field, order;
	var queryParams = {};
	var productModel = "ProductSalesRating";
	queryParams["vendor_name"] ='chandru Ismera';
	field = "id";
	order = "asc";
	offset = 0;
	limit = req.query.limit ? parseInt(req.query.limit) : config.paginationLimit;
	delete req.query.limit;

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
				count: results.products.count,
				statusCode: status
			});
		}
		else {
			res.render('view-listings', err);
		}
	});
}

export function editListings(req, res) {

	let searchObj = {}
	var productModel = "ProductSalesRating";

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


