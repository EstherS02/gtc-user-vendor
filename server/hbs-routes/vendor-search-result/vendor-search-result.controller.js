'use strict';

const async = require('async');
const sequelize = require('sequelize');
var _ = require('lodash');

const service = require('../../api/service');
const vendorService = require('../../api/vendor/vendor-service')
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const marketplace_type = require('../../config/marketplace_type');
const config = require('../../config/environment');

export function index(req, res) {
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var marketplaceURl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '').trim();
	var selectedLocation = 0;
	var selectedMarketPlace = 0;
	var page;
	var queryURI = {};
	var includeArr = [];
	var queryParameters = {};
	var LoggedInUser = {};
	var queryPaginationObj = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var marketPlaceModel = "Marketplace";
	var selectedMarketPlaceID = null;

	var offset, limit, field, order, layout;

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 15;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "sales_count";
	queryPaginationObj['field'] = field;
	delete req.query.field;
	order = req.query.order ? req.query.order : "desc";
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

	if (marketplaceURl == 'wholesalers') {
		selectedMarketPlaceID = marketplace['WHOLESALE'];
		queryParameters['marketplace_id'] = marketplace['WHOLESALE'];
	} else if (marketplaceURl == 'retailers') {
		selectedMarketPlaceID = marketplace['PUBLIC'];
		queryParameters['marketplace_id'] = marketplace['PUBLIC'];
	} else if (marketplaceURl == 'services-providers') {
		selectedMarketPlaceID = marketplace['SERVICE'];
		queryParameters['marketplace_id'] = marketplace['SERVICE'];
	} else if (marketplaceURl == 'subscription-providers') {
		selectedMarketPlaceID = marketplace['LIFESTYLE'];
		queryParameters['marketplace_id'] = marketplace['LIFESTYLE'];
	} else{
		selectedMarketPlaceID =null;
	}

	queryPaginationObj['marketplaceURl'] = marketplaceURl;

	if (selectedMarketPlaceID) {
		queryURI['marketplace'] = parseInt(selectedMarketPlaceID);
	}else{
		queryURI['marketplace'] = req.query.marketplace;
	}
	
	if (req.query.marketplace) {
		queryParameters['marketplace_id'] = req.query.marketplace;
		// queryURI['selected_marketplace'] = req.query.marketplace;
	}

	if (req.query.location) {
		selectedLocation = req.query.location;
		queryURI['location'] = req.query.location;
		queryParameters['origin_id'] = req.query.location;
	}

	queryParameters['status'] = status["ACTIVE"];

	var vendorModel = "VendorUserProduct";

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
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
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
		locations: function(callback) {
			var result = {};
			var locationQueryObj = {};
			var vendorCountQueryParams = {};
			var vendorMarketPlaceQueryParams = {};

			locationQueryObj['status'] = status["ACTIVE"];

			vendorCountQueryParams['status'] = status["ACTIVE"];

			vendorMarketPlaceQueryParams['status'] = status["ACTIVE"];
			if (selectedMarketPlaceID) {
				vendorMarketPlaceQueryParams['marketplace_id'] = parseInt(selectedMarketPlaceID);
			}

			model['Country'].findAll({
				where: locationQueryObj,
				include: [{
					model: model['Vendor'],
					where: vendorCountQueryParams,
					attributes: ['id', 'base_location'],
					required: false
				}],
				attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Vendors.id')), 'vendor_count']],
				group: ['Country.id']
			}).then(function(results) {

				if (results.length > 0) {
					model['VendorUserProduct'].count({
						where: vendorMarketPlaceQueryParams
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
		vendorCountByCountry: function(callback) {
			var countryCountParams = [];
			if (selectedMarketPlaceID) {
				countryCountParams['marketplace_id'] = parseInt(selectedMarketPlaceID);
			}else{
				countryCountParams['marketplace_id'] = req.query.marketplace;
			}
			var resultObj = {};
			if (countryCountParams.marketplace_id) {
				vendorService.vendorCountByCountry(countryCountParams)
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
			} else {
				vendorService.vendorCountByCountryForHome()
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
			}
		},
		vendors: function(callback) {
			service.findAllRows(vendorModel, includeArr, queryParameters, offset, limit, field, order)
				.then(function(vendors) {
					return callback(null, vendors);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
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
		vendorCountByMarketplace: function(callback) {
			var result = {};
			var queryObj={};
			if((selectedMarketPlaceID != marketplace['LIFESTYLE'])||(selectedMarketPlaceID != marketplace['SERVICE'])||(selectedMarketPlaceID != marketplace['PUBLIC'])){
				 queryObj.markerplace_id = marketplace['WHOLESALE'];
			}

			vendorService.vendorCountByMarketplace(queryObj)
				.then((response) => {
					result.rows = JSON.parse(JSON.stringify(response));
					return callback(null, result);
				}).catch((error) => {
					console.log('Error :::', error);
					return callback(error, null);
				});
		}
	}, function(error, results) {
		queryPaginationObj['maxSize'] = 5;
		if (!error) {
			res.render('vendor-search', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				queryURI: queryURI,
				queryPaginationObj: queryPaginationObj,
				locations: results.locations,
				VendorCountByCountry: results.vendorCountByCountry,
				vendors: results.vendors,
				cart: results.cartInfo,
				marketPlace: marketplace,
				selectedMarketPlace: results.selectedMarketPlace,
				LoggedInUser: LoggedInUser,
				marketplaceURl: marketplaceURl,
				selectedLocation: selectedLocation,
				layout_type: layout,
				allMarkerPlace: results.vendorCountByMarketplace
			})
		}
	});
}