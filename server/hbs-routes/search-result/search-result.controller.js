'use strict';

const async = require('async');
const sequelize = require('sequelize');
const moment = require('moment');
var _ = require('lodash');
const service = require('../../api/service');
const searchResultService = require('../../api/service/search-result.service');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const cartService = require('../../api/cart/cart.service');
const config = require('../../config/environment');
const durationConfig = require('../../config/duration');
const productService = require('../../api/product/product.service');

export function index(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var offset, limit, field, order, layout, page;

	var currentMarketPlace = req.originalUrl.split('/')[1];
	var selectedMarketPlaceID = null;
	var selectedMarketPlaceTypeID = null;
	var isFeaturedProduct = false;

	var queryURI = {};
	var queryPaginationObj = {};
	var productQueryParams = {};
	var productCountQueryParams = {};
	var productCountCategory = {};
	var vendorDetailsQueryParams = {};

	var categoryModel = "Category";
	var marketPlaceModel = "Marketplace";
	var marketPlaceTypeModel = "MarketplaceType";
	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}

	if (currentMarketPlace == 'wholesale') {
		selectedMarketPlaceID = marketplace['WHOLESALE'];
	} else if (currentMarketPlace == 'shop') {
		selectedMarketPlaceID = marketplace['PUBLIC'];
	} else if (currentMarketPlace == 'services') {
		selectedMarketPlaceID = marketplace['SERVICE'];
	} else if (currentMarketPlace == 'lifestyle') {
		selectedMarketPlaceID = marketplace['LIFESTYLE'];
	} else {
		selectedMarketPlaceID = null;
	}

	if (req.query.marketplace_type) {
		selectedMarketPlaceTypeID = parseInt(req.query.marketplace_type);
	}

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 30;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "created_on";
	queryURI['field'] = field;
	queryPaginationObj['field'] = field;
	delete req.query.field;
	order = req.query.order ? req.query.order : "desc";
	queryURI['order'] = order;
	queryPaginationObj['order'] = order;
	delete req.query.order;
	layout = req.query.layout ? req.query.layout : 'grid';
	queryURI['layout'] = layout;
	queryPaginationObj['layout'] = layout;
	delete req.query.layout;

	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;

	productQueryParams['status'] = status['ACTIVE'];
	productCountQueryParams['status'] = status['ACTIVE'];
	productCountCategory['status'] = status['ACTIVE'];

	if (selectedMarketPlaceID) {
		queryURI['marketplace'] = parseInt(selectedMarketPlaceID);
		productQueryParams['marketplace_id'] = parseInt(selectedMarketPlaceID);
		productCountQueryParams['marketplace_id'] = parseInt(selectedMarketPlaceID);
		productCountCategory['marketplace_id'] = parseInt(selectedMarketPlaceID);
	}

	if (selectedMarketPlaceTypeID) {
		queryURI['marketplace_type'] = parseInt(selectedMarketPlaceTypeID);
		productQueryParams['marketplace_type_id'] = parseInt(selectedMarketPlaceTypeID);
		productCountQueryParams['marketplace_type_id'] = parseInt(selectedMarketPlaceTypeID);
		productCountCategory['marketplace_type_id'] = parseInt(selectedMarketPlaceTypeID);
	}

	if (req.query.is_featured_product) {
		isFeaturedProduct = true;
		queryURI['is_featured_product'] = parseInt(req.query.is_featured_product);
		productQueryParams['is_featured_product'] = parseInt(req.query.is_featured_product);
		productCountQueryParams['is_featured_product'] = parseInt(req.query.is_featured_product);
		// productQueryParams['position'] = 'position_searchresult';
		productCountCategory['is_featured_product'] = parseInt(req.query.is_featured_product);
	}

	if (req.query.category) {
		queryURI['category'] = parseInt(req.query.category);
		productQueryParams['product_category_id'] = parseInt(req.query.category);
		productCountQueryParams['product_category_id'] = parseInt(req.query.category);
		productCountCategory['product_category_id'] = parseInt(req.query.category);
	}

	if (req.query.sub_category) {
		queryURI['sub_category'] = parseInt(req.query.sub_category);
		productQueryParams['sub_category_id'] = parseInt(req.query.sub_category);
		productCountQueryParams['sub_category_id'] = parseInt(req.query.sub_category);
		productCountCategory['sub_category_id'] = parseInt(req.query.sub_category);
	}

	if (req.query.location) {
		queryURI['location'] = req.query.location;
		productQueryParams['product_location'] = req.query.location;
		productCountQueryParams['product_location'] = req.query.location;
		productCountCategory['product_location'] = req.query.location;
	}
	//changed a "keyword" for "search/keyword"
	if (req.query.keyword) {
		queryPaginationObj.keyword = req.query.keyword;
		queryURI['keyword'] = req.query.keyword;
		productQueryParams['product_name'] = {
			like: '%' + req.query.keyword + '%'
		};
		productCountQueryParams['keyword'] = req.query.keyword;
		productCountCategory['keyword'] = req.query.keyword;
	}

	if (req.query.origin) {
		queryURI['origin'] = req.query.origin;
		productQueryParams['$or'] = [{
			'country_name': req.query.origin
		}, {
			'state_name': req.query.origin
		}, {
			'city': req.query.origin
		}];
	}

	if (req.query.start_date && req.query.end_date) {
		queryURI['start_date'] = req.query.start_date;
		queryURI['end_date'] = req.query.end_date;
		productQueryParams['created_on'] = {
			'$gte': req.query.start_date,
			'$lte': req.query.end_date
		};
		productCountQueryParams['start_date'] = req.query.start_date;
		productCountQueryParams['end_date'] = req.query.end_date;
	}

	if (req.query.vendor_id) {
		queryURI['vendor_id'] = req.query.vendor_id;
		productQueryParams['vendor_id'] = req.query.vendor_id;
		productCountQueryParams['vendor_id'] = req.query.vendor_id;
		productCountCategory['vendor_id'] = req.query.vendor_id;
		vendorDetailsQueryParams['vendor_id'] = req.query.vendor_id;
	}

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
		categories: function(callback) {
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "name";
			const categoryOrder = "asc";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, [], categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		selectedMarketPlace: function(callback) {
			service.findIdRow(marketPlaceModel, selectedMarketPlaceID, [])
				.then(function(result) {
					return callback(null, result);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		selectedMarketPlaceType: function(callback) {
			var queryObj = {};

			queryObj['id'] = selectedMarketPlaceTypeID;
			queryObj['marketplace_id'] = selectedMarketPlaceID;

			service.findOneRow(marketPlaceTypeModel, queryObj, [])
				.then(function(result) {
					return callback(null, result);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		products: function(callback) {
			productService.queryAllProducts(LoggedInUser.id, productQueryParams, offset, limit, field, order)
				.then(function(results) {
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		topProducts: function(callback) {
			productQueryParams['is_featured_product'] = 1;
			productQueryParams['position'] = 'position_searchresult';
			productService.queryAllProducts(LoggedInUser.id, productQueryParams, 0, 3)
				.then(function(results) {
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		productsCountBasedOnMarketplaceTypes: function(callback) {
			// searchResultService.marketplacetypeWithProductCount(productCountQueryParams, isFeaturedProduct)
			// 	.then(function(response) {
			// 		return callback(null, response);
			// 	}).catch(function(error) {
			// 		console.log('Error :::', error);
			// 		return callback(null);
			// 	});
			var result = {};
			if ((selectedMarketPlaceID != marketplace['PUBLIC']) || (selectedMarketPlaceID != marketplace['SERVICE']) || (selectedMarketPlaceID != marketplace['LIFESTYLE'])) {
				searchResultService.productCountForMareketplace(productCountQueryParams)
					.then(function(response) {
						var count = 0;
						
						var char = JSON.parse(JSON.stringify(response));
						result.rows = char;
						_.each(char, function(Element){
							count=count + Element.product_count;
						})
						result.count= count;
						return callback(null, result);
					}).catch(function(error) {
						console.log('Error:::', error);
						return callback(null);
					});
			} else {
				result.count=0;
				result.rows = [];
				return callback(result);
			}
		},
		productsCountBasedOnCountry: function(callback) {
			searchResultService.countryWithProductCount(productCountQueryParams, isFeaturedProduct)
				.then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		productsCountBasedOnCategories: function(callback) {
			searchResultService.categoryWithProductCount(productCountQueryParams, isFeaturedProduct)
				.then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		productCount: function(callback) {
			var resultObj = {};
			var productCount ={};
			searchResultService.productCountForCategoryAndSubcategory(productCountCategory)
				.then(function(response) {
					var char = JSON.parse(JSON.stringify(response));
					var count = 0;
					_.each(char, function(o) {
						if (_.isUndefined(resultObj[o.categoryname])) {
							resultObj[o.categoryname] = {};
							resultObj[o.categoryname]["categoryName"] = o.categoryname;
							resultObj[o.categoryname]["categoryID"] = o.categoryid;
							resultObj[o.categoryname]["count"] = 0;
							resultObj[o.categoryname]["subCategory"] = [];

						}
						var subCatObj = {}
						subCatObj["subCategoryName"] = o.subcategoryname;
						subCatObj["subCategoryId"] = o.subcategoryid;
						subCatObj["count"] = o.subproductcount;
						resultObj[o.categoryname]["count"] += Number(o.subproductcount);
						resultObj[o.categoryname]["subCategory"].push(subCatObj)
						count= count + o.subproductcount;
					})
					productCount.count = count;
					productCount.rows = resultObj;
					return callback(null, productCount);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		countryProductCount: function(callback) {
			var resultObj = {};
			var countryProductCount ={};
			searchResultService.productCountForCountry(productCountCategory)
				.then(function(response) {
					var char = JSON.parse(JSON.stringify(response));
					var count = 0;
					_.each(char, function(o) {
						if (_.isUndefined(resultObj[o.regionname])) {
							resultObj[o.regionname] = {};
							resultObj[o.regionname]["regionname"] = o.regionname;
							resultObj[o.regionname]["regionid"] = o.regionid;
							resultObj[o.regionname]["count"] = 0;
							resultObj[o.regionname]["subCategory"] = [];

						}
						var subCatObj = {}
						subCatObj["countryname"] = o.countryname;
						subCatObj["countryid"] = o.countryid;
						subCatObj["count"] = o.productcount;
						resultObj[o.regionname]["count"] += Number(o.productcount);
						resultObj[o.regionname]["subCategory"].push(subCatObj)
						count= count + o.productcount;
					})
					countryProductCount.count = count;
					countryProductCount.rows = resultObj;
					return callback(null, countryProductCount);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(error, results) {
		queryPaginationObj['maxSize'] = 5;
		if (!error && results) {
			res.render('search', {
				title: "Global Trade Connect",
				cart: results.cartInfo,
				marketPlace: marketplace,
				categories: results.categories,
				bottomCategory: bottomCategory,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				LoggedInUser: LoggedInUser,
				selectedMarketPlaceID: selectedMarketPlaceID,
				selectedMarketPlace: results.selectedMarketPlace,
				selectedMarketPlaceTypeID: selectedMarketPlaceTypeID,
				selectedMarketPlaceType: results.selectedMarketPlaceType,
				products: results.products,
				topFeaturedProducts: results.topProducts,
				locations: results.productsCountBasedOnCountry,
				categoriesWithCount: results.productsCountBasedOnCategories,
				marketPlaceTypes: results.productsCountBasedOnMarketplaceTypes,
				marketplaceURl: currentMarketPlace,
				durations: durationConfig,
				layout_type: layout,
				productCount: results.productCount,
				countryProductCount: results.countryProductCount
			});
		} else {
			res.render('search', error);
		}
	});
}