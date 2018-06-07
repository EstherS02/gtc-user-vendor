'use strict';

const async = require('async');

const service = require('../../api/service');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const config = require('../../config/environment');

export function index(req, res) {

	var selectedMarketPlaceType = 0;
	var selectedCategory = 0;
	var selectedLocation = 0;
	var queryObj = {};
	var LoggedInUser = {};
	var topQueryObj = {};
	var page;
	var productEndPoint = "MarketplaceProduct";
	var offset, limit, field, order;

	if (req.query.marketplace_type) {
		selectedMarketPlaceType = req.query.marketplace_type;
	}

	if (req.query.category) {
		selectedCategory = req.query.category;
	}

	if (req.query.location) {
		selectedLocation = req.query.location;
	}

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 12; //config.paginationLimit;
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
		locations: function(callback) {
			var countryQueryObj = {};
			var countryIncludeArr = [];
			var countryOffset = 0;
			var countryLimit = null;
			var countryOrderBy = "id";
			var countryOrderType = "ASC";
			var countryEndPoint = "Country";

			countryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(countryEndPoint, countryIncludeArr, countryQueryObj, countryOffset, countryLimit, countryOrderBy, countryOrderType)
				.then(function(results) {
					return callback(null, results.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				})
		},
		categories: function(callback) {
			var categoryQueryObj = {};
			var categoryIncludeArr = [];
			var categoryOffset = 0;
			var categoryLimit = null;
			var categoryOrderBy = "id";
			var categoryOrderType = "ASC";
			var categoryEndPoint = "Category";

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryEndPoint, categoryIncludeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryOrderBy, categoryOrderType)
				.then(function(results) {
					return callback(null, results.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				})
		},
		marketPlaceTypes: function(callback) {
			var marketplaceTypeQueryObj = {};
			var marketplaceTypeIncludeArr = [];
			var marketplaceTypeOffset = 0;
			var marketplaceTypeLimit = null;
			var marketplaceTypeOrderBy = "id";
			var marketplaceTypeOrderType = "ASC";
			var marketplaceTypeEndPoint = "MarketplaceType";

			marketplaceTypeQueryObj['status'] = status["ACTIVE"];
			marketplaceTypeQueryObj['marketplace_id'] = marketplace['WHOLESALE'];

			service.findAllRows(marketplaceTypeEndPoint, marketplaceTypeIncludeArr, marketplaceTypeQueryObj, marketplaceTypeOffset, marketplaceTypeLimit, marketplaceTypeOrderBy, marketplaceTypeOrderType)
				.then(function(results) {
					return callback(null, results.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				})
		},
		topProducts: function(callback) {
			var topLimit, topField, topOrder;
			topQueryObj['is_featured_product'] = 1;
			topLimit = 3;
			topField = 'created_on';
			topOrder = 'desc';

			service.findRows(productEndPoint, topQueryObj, 0, topLimit, topField, topOrder)
				.then(function(results) {
					return callback(null, results.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		products: function(callback) {
			service.findRows(productEndPoint, queryObj, offset, limit, field, order)
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
				marketPlaceTypes: results.marketPlaceTypes,
				selectedMarketPlaceType: selectedMarketPlaceType,
				categories: results.categories,
				selectedCategory: selectedCategory,
				locations: results.locations,
				selectedLocation: selectedLocation,
				topProductResults: results.topProducts,
				productResults: results.products.rows,
				collectionSize: results.products.count,
				page: page,
				pageSize: limit,
				offset: offset,
				maxSize: 5,
				LoggedInUser: LoggedInUser
			});
		} else {
			console.log('Error:::', error);
			res.render('search', error);
		}
	});
}