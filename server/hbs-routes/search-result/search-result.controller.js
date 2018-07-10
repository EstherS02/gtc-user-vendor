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
	var queryURI = {};
	var includeArr = [];
	var LoggedInUser = {};
	var queryParameters = {};
	var queryPaginationObj = {};
	var marketPlaceTypeSelected = {};

	var offset, limit, field, order;
	var productEndPoint = "MarketplaceProduct";

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 12;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	queryPaginationObj['field'] = field;
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	queryPaginationObj['order'] = order;
	delete req.query.order;

	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;

	if (req.query.keyword) {
		queryPaginationObj.keyword = req.query.keyword;
		queryURI['keyword'] = req.query.keyword;
		queryParameters['product_name'] = {
			like: '%' + req.query.keyword + '%'
		};
	}
	if (req.query.origin) {
		queryURI['origin'] = req.query.origin;
		queryParameters['$or'] = [{
			country_name: req.query.origin
		}, {
			state_name: req.query.origin
		}, {
			city: req.query.origin
		}];
	}
	if (req.query.is_featured_product) {
		queryURI['is_featured_product'] = req.query.is_featured_product;
		queryParameters['is_featured_product'] = req.query.is_featured_product;
	}
	if (req.query.location) {
		selectedLocation = req.query.location;
		queryURI['location'] = req.query.location;
		queryParameters['product_location_id'] = req.query.location;
	}
	if (req.query.category) {
		selectedCategory = req.query.category;
		queryURI['category'] = req.query.category;
		queryParameters['category_id'] = req.query.category;
	}
	if (req.query.sub_category) {
		selectedSubCategory = req.query.sub_category;
		queryURI['sub_category'] = req.query.sub_category;
		queryParameters['sub_category_id'] = req.query.sub_category;
	}
	if (req.query.marketplace) {
		selectedMarketPlace = req.query.marketplace;
		queryURI['marketplace'] = req.query.marketplace;
		queryParameters['marketplace_id'] = req.query.marketplace;
	}
	if (req.query.marketplace_type) {
		selectedMarketPlaceType = req.query.marketplace_type;
		queryURI['marketplace_type'] = req.query.marketplace_type;
		queryParameters['marketplace_type_id'] = req.query.marketplace_type;
	}
	if (req.query.vendor_id) {
		queryURI['vendor_id'] = req.query.vendor_id;
		queryParameters['vendor_id'] = req.query.vendor_id;
	}
	queryParameters['status'] = status["ACTIVE"];

	async.series({
		marketPlace: function(callback) {
			var marketPlaceModel = "Marketplace";
			service.findIdRow(marketPlaceModel, selectedMarketPlace, includeArr)
				.then(function(result) {
					return callback(null, result);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		marketPlaceTypeSelected: function(callback) {
			var queryObj = {};
			var marketPlaceTypeModel = "MarketplaceType";

			queryObj['marketplace_id'] = selectedMarketPlace;
			queryObj['id'] = selectedMarketPlaceType;
			service.findOneRow(marketPlaceTypeModel, queryObj, includeArr)
				.then(function(result) {
					return callback(null, result);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
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
					return callback(null, results);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		marketPlaceTypes: function(callback) {
			var result = {};
			var marketplaceTypeQueryObj = {};
			var productCountQueryParames = {};

			marketplaceTypeQueryObj['status'] = status["ACTIVE"];
			marketplaceTypeQueryObj['marketplace_id'] = marketplace['WHOLESALE'];

			productCountQueryParames['status'] = status["ACTIVE"];
			productCountQueryParames['marketplace_id'] = marketplace['WHOLESALE'];
			if (req.query.location) {
				productCountQueryParames['product_location'] = req.query.location;
			}
			if (req.query.category) {
				productCountQueryParames['product_category_id'] = req.query.category;
			}
			if (req.query.sub_category) {
				productCountQueryParames['sub_category_id'] = req.query.sub_category;
			}
			if (req.query.keyword) {
				productCountQueryParames['product_name'] = {
					like: '%' + req.query.keyword + '%'
				};
			}
			service.getMarketPlaceTypes(marketplaceTypeQueryObj, productCountQueryParames)
                    .then(function(response) {
                        return callback(null, response);

                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(null);
                    });
		},
		locations: function(callback) {
			var result = {};
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
			if (req.query.category) {
				productCountQueryParames['product_category_id'] = req.query.category;
			}
			if (req.query.sub_category) {
				productCountQueryParames['sub_category_id'] = req.query.sub_category;
			}
			if (req.query.keyword) {
				productCountQueryParames['product_name'] = {
					like: '%' + req.query.keyword + '%'
				};
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
				if (results.length > 0) {
					model['Product'].count({
						where: productCountQueryParames
					}).then(function(count) {
						result.count = count;
						result.rows = JSON.parse(JSON.stringify(results));
						return callback(null, result);
					}).catch(function(error) {
						console.log('Error:::', error);
						return callback(error, null);
					});
				} else {
					result.count = 0;
					result.rows = [];
					return callback(null, result);
				}
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
		},
		categories: function(callback) {
			var result = {};
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
			if (req.query.keyword) {
				productCountQueryParames['product_name'] = {
					like: '%' + req.query.keyword + '%'
				};
			}

			service.getCategory(categoryQueryObj, productCountQueryParames)
                .then(function(response) {
                    return callback(null, response);

                }).catch(function(error) {
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
	}, function(error, results) {
		queryPaginationObj['maxSize'] = 5;
		if (!error) {
			res.render('search', {
				title: "Global Trade Connect",
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				LoggedInUser: LoggedInUser,
				selectedLocation: selectedLocation,
				selectedCategory: selectedCategory,
				selectedSubCategory: selectedSubCategory,
				selectedMarketPlace: results.marketPlace,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				selectedMarketPlaceType: selectedMarketPlaceType,
				marketPlaceTypeSelected: results.marketPlaceTypeSelected,
				productResults: results.products,
				topFeaturedProducts: results.topProducts,
				marketPlaceTypes: results.marketPlaceTypes,
				locations: results.locations,
				categories: results.categories,
				category: results.category
			});
		} else {
			res.render('search', error);
		}
	});
}