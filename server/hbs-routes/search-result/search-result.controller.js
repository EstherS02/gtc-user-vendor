'use strict';

const async = require('async');

const service = require('../../api/service');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const config = require('../../config/environment');

export function index(req, res) {
	var selectedMarketPlace = 0;
	var selectedMarketPlaceType = 0;
	var queryObj = {};
	var topQueryObj = {};
	var page;
	var endPointName = "MarketplaceProduct";
	var offset, limit, field, order;

	if (req.query.marketplace) {
		selectedMarketPlace = req.query.marketplace; 
	}

	if (req.query.marketplace_type) {
		selectedMarketPlaceType = req.query.marketplace_type; 
	}

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : config.paginationLimit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;

	queryObj['status'] = status["ACTIVE"];
	topQueryObj['status'] = status["ACTIVE"];

	async.series({
		topProducts: function(callback) {
			var topLimit, topField, topOrder;
			topQueryObj['is_featured_product'] = 1;
			topLimit = 3;
			topField = 'created_on';
			topOrder = 'desc';

			service.findRows(endPointName, topQueryObj, 0, topLimit, topField, topOrder)
				.then(function(results) {
					return callback(null, results.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		products: function(callback) {
			service.findRows(endPointName, queryObj, offset, limit, field, order)
				.then(function(results) {
					return callback(null, results);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		}
	}, function(error, results) {
		if (!error) {
			res.render('search', {
				title: "Global Trade Connect",
				marketPlace: marketplace,
                marketPlaceType: marketplace_type,
                selectedMarketPlace: selectedMarketPlace,
                selectedMarketPlaceType: selectedMarketPlaceType,
				topProductResults: results.topProducts,
				productResults: results.products.rows,
				collectionSize: results.products.count,
				page: page,
				pageSize: limit,
				offset: offset,
				maxSize: 5
			});
		} else {
			console.log('Error:::', error);
			res.render('search', error);
		}
	});
}