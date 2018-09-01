'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const RawQueries = require('../../raw-queries/sql-queries');
const moment = require('moment');
const status = require('../../config/status');
var async = require('async');
const _ = require('lodash');


function processGeoLocateSearch(req, res, cbNext) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var queryURI = {};

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
		cartCounts: function(callback) {
			service.cartHeader(LoggedInUser).then(function(response) {
				return callback(null, response);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		categories: function(callback) {
			let includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			let categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = statusCode["ACTIVE"];

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
		fetchAllSubcategories: function(callback) {
			let includeArr = [];
			let subCategoryQueryObj = {};
			subCategoryQueryObj['status'] = statusCode["ACTIVE"];

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
			countryQueryObj['status'] = statusCode["ACTIVE"];

			service.findAllRows('Country', includeArr, countryQueryObj, 0, null, 'id', 'asc')
				.then(function(country) {
					return callback(null, country.rows);
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

				console.log("results.products.rows=========================", advancedSearchByVendor)

				let geo_locate_result = {
					title: "Global Trade Connect",
					queryURI: queryURI,
					categories: results.categories,
					allSubcategories: results.fetchAllSubcategories,
					country: results.fetchAllLocations,
					bottomCategory: bottomCategory,
					cartheader: results.cartCounts,
					geoLocateObj: results.geoLocateQuery,
					geoLocateByVendor: geoLocateByVendor,
					categoriesCount: results.categoriesCount.categoryObj,
					subCategoriesCount: results.categoriesCount.subCategoryObj,
					totalCategoryProducts: results.categoriesCount.totalCategoryProducts,
					advancedSearchProducts: results.products.rows,
					advancedSearchByVendor: advancedSearchByVendor,
					LoggedInUser: LoggedInUser
				}

				return cbNext(null, geo_locate_result)

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
		cartCounts: function(callback) {
			service.cartHeader(LoggedInUser).then(function(response) {
				return callback(null, response);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		categories: function(callback) {
			let includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			let categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = statusCode["ACTIVE"];

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
					cartheader: results.cartCounts,
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