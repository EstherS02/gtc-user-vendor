'use strict';

const async = require('async');
const sequelize = require('sequelize');

const service = require('../../api/service');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const config = require('../../config/environment');

export function index(req, res) {
	var selectedLocation = 0;
	var selectedCategory = 0;
	var selectedSubCategory = 0;
	var selectedMarketPlace = 0;
	var selectedMarketPlaceType = 0;

	var page;
	var includeArr = [];
	var LoggedInUser = {};
	var queryParameters = {};
	var offset, limit, field, order;
	var productEndPoint = "MarketplaceProduct";

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 12;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;

	if (req.query.location) {
		selectedLocation = req.query.location;
		queryParameters['product_location_id'] = req.query.location;
	}
	if (req.query.category) {
		selectedCategory = req.query.category;
		queryParameters['category_id'] = req.query.category;
	}
	if (req.query.sub_category) {
		selectedSubCategory = req.query.sub_category;
		queryParameters['sub_category_id'] = req.query.sub_category;
	}
	if (req.query.marketplace) {
		selectedMarketPlace = req.query.marketplace;
		queryParameters['marketplace_id'] = req.query.marketplace;
	}
	if (req.query.marketplace_type) {
		selectedMarketPlaceType = req.query.marketplace_type;
		queryParameters['marketplace_type_id'] = req.query.marketplace_type;
	}

	queryParameters['status'] = status["ACTIVE"];

	async.series({
		products: function(callback) {
			service.findAllRows(productEndPoint, includeArr, queryParameters, offset, limit, field, order)
				.then(function(results) {
					return callback(null, results);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		topProducts: function(callback) {
			var topOffset = 0;
			var topLimit = 3;
			var topOrderField = "created_on";
			var topOrderType = "DESC";

			queryParameters['is_featured_product'] = 1;

			service.findAllRows(productEndPoint, includeArr, queryParameters, topOffset, topLimit, topOrderField, topOrderType)
				.then(function(results) {
					return callback(null, results.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		marketPlaceTypes: function(callback) {
			var marketplaceTypeQueryObj = {};
			var productCountQueryParames = {};

			marketplaceTypeQueryObj['status'] = status["ACTIVE"];
			marketplaceTypeQueryObj['marketplace_id'] = marketplace['WHOLESALE'];

			productCountQueryParames['status'] = status["ACTIVE"];
			if (req.query.marketplace) {
				productCountQueryParames['marketplace_id'] = req.query.marketplace;
			}
			if (req.query.location) {
				productCountQueryParames['product_location'] = req.query.location;
			}

			model['MarketplaceType'].findAll({
				where: marketplaceTypeQueryObj,
				include: [{
					model: model['Product'],
					where: productCountQueryParames,
					attributes: [],
					required: false
				}],
				attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
				group: ['MarketplaceType.id']
			}).then(function(results) {
				var jsonParseResults = JSON.parse(JSON.stringify(results));
				return callback(null, jsonParseResults);
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
		},
		locations: function(callback) {
			var locationQueryObj = {};
			var productCountQueryParames = {};

			locationQueryObj['status'] = status["ACTIVE"];

			productCountQueryParames['status'] = status["ACTIVE"];
			if (req.query.marketplace) {
				productCountQueryParames['marketplace_id'] = req.query.marketplace;
			}
			if (req.query.marketplace_type) {
				productCountQueryParames['marketplace_type_id'] = req.query.marketplace_type;
			}

			model['Country'].findAll({
				where: locationQueryObj,
				include: [{
					model: model['Product'],
					where: productCountQueryParames,
					attributes: [],
					required: false
				}],
				attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
				group: ['Country.id']
			}).then(function(results) {
				var jsonParseResults = JSON.parse(JSON.stringify(results));
				return callback(null, jsonParseResults);
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
		},
		categories: function(callback) {
			var categoryQueryObj = {};
			var productCountQueryParames = {};

			categoryQueryObj['status'] = status["ACTIVE"];

			productCountQueryParames['status'] = status["ACTIVE"];
			if (req.query.marketplace) {
				productCountQueryParames['marketplace_id'] = req.query.marketplace;
			}
			if (req.query.marketplace_type) {
				productCountQueryParames['marketplace_type_id'] = req.query.marketplace_type;
			}
			if (req.query.location) {
				productCountQueryParames['product_location'] = req.query.location;
			}
			if (req.query.category) {
				productCountQueryParames['category_id'] = req.query.category;
			}

			model['Category'].findAll({
				where: categoryQueryObj,
				include: [{
					model: model['SubCategory'],
					where: categoryQueryObj,
					required: false,
					attributes: ['id', 'name', 'code']
				}]
			}).then(function(results) {
				var jsonParseResults = JSON.parse(JSON.stringify(results));
				console.log('jsonParseResults', jsonParseResults);
				return callback(null, jsonParseResults);
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
		}
	}, function(error, results) {
		if (!error) {
			res.render('search', {
				title: "Global Trade Connect",
				page: page,
				maxSize: 5,
				offset: offset,
				pageSize: limit,
				LoggedInUser: LoggedInUser,
				selectedLocation: selectedLocation,
				selectedCategory: selectedCategory,
				selectedSubCategory: selectedSubCategory,
				selectedMarketPlace: selectedMarketPlace,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				selectedMarketPlaceType: selectedMarketPlaceType,
				productResults: results.products.rows,
				collectionSize: results.products.count,
				topProductResults: results.topProducts,
				marketPlaceTypes: results.marketPlaceTypes,
				locations: results.locations,
				categories: results.categories
			});
		} else {
			res.render('search', error);
		}
	});
}

export function indexA(req, res) {

	var selectedCategory = 0;
	var selectedLocation = 0;
	var selectedMarketPlaceType = 0;

	var queryObj = {};
	var productQueryObj = {};
	var LoggedInUser = {};
	var topQueryObj = {};
	var page;
	var productEndPoint = "MarketplaceProduct";
	var offset, limit, field, order;

	productQueryObj['status'] = status["ACTIVE"];

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

	if (req.query.location) {
		productQueryObj['product_location'] = req.query.location;
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

			model['Country'].findAll({
				where: countryQueryObj,
				include: [{
					model: model['Product'],
					where: countryQueryObj,
					attributes: []
				}],
				attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
				group: ['Country.id']
			}).then(function(results) {
				return callback(null, JSON.parse(JSON.stringify(results)));
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
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

			marketplaceTypeQueryObj['status'] = status["ACTIVE"];
			marketplaceTypeQueryObj['marketplace_id'] = marketplace['WHOLESALE'];

			model['MarketplaceType'].findAll({
				where: marketplaceTypeQueryObj,
				include: [{
					model: model['Product'],
					where: productQueryObj,
					attributes: [],
					required: false
				}],
				attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
				group: ['MarketplaceType.id']
			}).then(function(results) {
				return callback(null, JSON.parse(JSON.stringify(results)));
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
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
				marketPlaceType: marketplace_type,
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