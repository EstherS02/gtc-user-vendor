'use strict';

const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const RawQueries = require('../../raw-queries/sql-queries');
const cartService = require('../../api/cart/cart.service');
const searchResultService = require('../../api/service/search-result.service');
const productService = require('../../api/product/product.service');
const marketplace = require('../../config/marketplace');

function processGeoLocateSearch(req, res, cbNext) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var productCountCategory = {};
	var productQueryParams={};
	var queryPaginationObj={};
	var queryURI = {};
	var offset, limit, field, order, page;
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

	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;
	// var offset = 0;
	// var limit = 0;
	// var field = "created_on";
	// var order = "desc";
	if (req.query.selected_category_id)
		queryURI['selected_category_id'] = req.query.selected_category_id;

	if (req.query.selected_sub_category_id)
		queryURI['selected_sub_category_id'] = req.query.selected_sub_category_id;

	if (req.query.selected_location_id)
		queryURI['selected_location_id'] = req.query.selected_location_id;

	if (req.query.price_min)
		queryURI['price_min'] = req.query.price_min;

	if (req.query.price_max)
		queryURI['price_max'] = req.query.price_max;

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;


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
				var includeArr = [];
				var categoryOffset, categoryLimit, categoryField, categoryOrder;
				var categoryQueryObj = {};
	
				categoryOffset = 0;
				categoryLimit = null;
				categoryField = "id";
				categoryOrder = "asc";
				
				categoryQueryObj['status'] = status["ACTIVE"];
	
				service.findAllRows('Category', includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
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
			fetchAllSubcategories: function(callback) {
				let includeArr = [];
				let subCategoryQueryObj = {};
				subCategoryQueryObj['status'] = status["ACTIVE"];

				service.findAllRows('SubCategory', includeArr, subCategoryQueryObj, 0, null, 'id', 'asc')
					.then(function(subCategory) {
						return callback(null, subCategory.rows);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			fetchAllLocations: function(callback) {
				let includeArr = [];
				let countryQueryObj = {};
				countryQueryObj['status'] = status["ACTIVE"];

				service.findAllRows('Country', includeArr, countryQueryObj, 0, null, 'id', 'asc')
					.then(function(country) {
						return callback(null, country.rows);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			countryProductCount: function(callback) {
				var resultObj = {};
				searchResultService.productCountForCountry(productCountCategory)
					.then(function(response) {
						var char = JSON.parse(JSON.stringify(response));
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
						})
						return callback(null, resultObj);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			wholeproducts: function(callback) {
				productService.queryAllProducts(LoggedInUser.id, productQueryParams, offset, limit, field, order)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			productCount: function(callback) {
				var resultObj = {};
	
				searchResultService.productCountForCategoryAndSubcategory(productCountCategory)
					.then(function(response) {
						var char = JSON.parse(JSON.stringify(response));
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
						})
						return callback(null, resultObj);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			categoriesCount: function(callback) {
				service.categoryAndSubcategoryCount().then(function(result) {
					return callback(null, result);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(error);
				});
			},
			geoLocateQuery: function(callback) {
				let lat = 13.07895029;
				let lng = 80.1807242;

				service.geoLocationFetch(lat, lng).then(function(geoLocationResp) {
					return callback(null, geoLocationResp);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(error);
				});
			},
			products: function(callback) {
				let includeArr = [{
					model: model['Vendor']
					
				}, {
					model: model["ProductMedia"],
					where: {
						base_image: 1,
						status: {
							'$eq': status["ACTIVE"]
						}
					}
				}];

				let searchObj = {};
				searchObj['status'] = {
					'$eq': status["ACTIVE"]
				}
				if (req.query.price_min && req.query.price_max) {
					searchObj['price'] = {
						'$between': [parseFloat(req.query.price_min), parseFloat(req.query.price_max)]
					}
				} else if (req.query.price_min) {
					searchObj['price'] = {
						'$gte': parseFloat(req.query.price_min)
					}
				} else if (req.query.price_max) {
					searchObj['price'] = {
						'$lte': parseFloat(req.query.price_max)
					}
				}
				if (req.query.selected_category_id)
					searchObj['product_category_id'] = req.query.selected_category_id;
				if (req.query.selected_sub_category_id)
					searchObj['sub_category_id'] = req.query.selected_sub_category_id;
				if (req.query.selected_location_id)
					searchObj['product_location'] = req.query.selected_location_id;
				if(req.query.city)
					searchObj['city'] = req.query.origin;
				if(req.query.keyword)
				searchObj['product_name'] = {
					like: '%' + req.query.keyword + '%'
				};

				service.findAllRows("Product", includeArr, searchObj, 0, null, 'id', 'asc')
					.then(function(results) {
						return callback(null, results);
					})
					.catch(function(error) {
						console.log('Error:::', error);
						return callback(error, null);
					});
			}
		},
		function(err, results) {
			if (!err) {
				let geoLocateByVendor = _.groupBy(results.geoLocateQuery, "vendor_id");
				let advancedSearchByVendor = _.groupBy(results.products.rows, 'vendor_id');

				let geo_locate_result = {
					title: "Global Trade Connect",
					queryURI: queryURI,
					categories: results.categories,
					allSubcategories: results.fetchAllSubcategories,
					country: results.fetchAllLocations,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					geoLocateObj: results.geoLocateQuery,
					geoLocateByVendor: geoLocateByVendor,
					categoriesCount: results.categoriesCount.categoryObj,
					subCategoriesCount: results.categoriesCount.subCategoryObj,
					totalCategoryProducts: results.categoriesCount.totalCategoryProducts,
					advancedSearchProducts: results.products.rows,
					products: results.wholeproducts,
					advancedSearchByVendor: advancedSearchByVendor,
					countryProductCount: results.countryProductCount,
					productCount: results.productCount,
					LoggedInUser: LoggedInUser
				}
				return cbNext(null, geo_locate_result);
			} else {
				return cbNext(err, null);
			}
		});
}


function processGeoLocate(req, res, cbNext) {
	var LoggedInUser = {};
	var bottomCategory = {};

	//default location if location not available
	let userLatitude = 13.0789474;
	let userLongitude = 80.180729;

	if (req.query.lat)
		userLatitude = req.query.lat;
	if (req.query.lon)
		userLongitude = req.query.lon;

	userLatitude = parseFloat(userLatitude).toFixed(6);
	userLongitude = parseFloat(userLongitude).toFixed(6);

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;


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
				let includeArr = [];
				const categoryOffset = 0;
				const categoryLimit = null;
				const categoryField = "id";
				const categoryOrder = "asc";
				let categoryModel = "Category";
				const categoryQueryObj = {};

				categoryQueryObj['status'] = status["ACTIVE"];

				service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
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
			geoLocateQuery: function(callback) {
				service.geoLocationFetch(userLatitude, userLongitude).then(function(geoLocationResp) {
					return callback(null, geoLocationResp);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(error);
				});
			}
		},
		function(err, results) {
			if (!err) {
				let geoLocateByVendor = _.groupBy(results.geoLocateQuery, "vendor_id");
				let geo_locate_result = {
					title: "Global Trade Connect",
					categories: results.categories,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					geoLocateObj: results.geoLocateQuery,
					geoLocateByVendor: geoLocateByVendor,
					LoggedInUser: LoggedInUser
				}
				return cbNext(null, geo_locate_result)
			} else {
				return cbNext(err, null);
			}
		});
}

export function geoLocate(req, res) {
	processGeoLocate(req, res, function(err, obj) {
		if (err) {
			return res.status(500).render('geo-locate', err);
		} else {
			return res.status(200).render('geo-locate', obj);
		}
	});
}

export function geoLocateSearch(req, res) {
	processGeoLocateSearch(req, res, function(err, obj) {
		if (err) {
			return res.status(500).render('geo-locate-search', err);
		} else {
			return res.status(200).render('geo-locate-search', obj);
		}
	});
}