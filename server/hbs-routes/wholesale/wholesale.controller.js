'use strict';

const sequelize = require('sequelize');
const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');
const marketplace = require('../../config/marketplace');
const plan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');
const vendorService = require('../../api/vendor/vendor.service');
const marketplace_type = require('../../config/marketplace_type');
const productService = require('../../api/product/product.service');
const async = require('async');

export function wholeSaleProductView(req, res) {
	var modeName = "Product";
	var queryObj = {};
	var includeArr = [];

	queryObj['product_slug'] = req.params.productSlugName;
	queryObj['status'] = status["ACTIVE"];

	includeArr = populate.populateData("Marketplace,MarketplaceType,Category,SubCategory,Country,State")

	service.findOneRow(modeName, queryObj, includeArr)
		.then(function(product) {
			console.log('product', product);
			res.render('product-view', {
				title: "Global Trade Connect"
			});
		})
		.catch(function(error) {
			console.log('Error:::', error);
			res.render('product-view', err);
		})
}

export function wholesale(req, res) {
	var vendorModel = "VendorUserProduct";
	var productAdModelName = 'ProductAdsSetting';
	var categoryModel = "Category";
	var countryModel = "Country";
	var typeModel = "MarketplaceType";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};

	offset = 0;
	limit = 20;
	field = "created_on";
	order = "desc";

	queryObj['status'] = status["ACTIVE"];

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
		wantToSell: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTS'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(wantToSell) {
					return callback(null, wantToSell.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToBuy: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTB'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(wantToBuy) {
					return callback(null, wantToBuy.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToTrade: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTT'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(wantToTrade) {
					return callback(null, wantToTrade.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		requestForQuote: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['RFQ'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(requestForQuote) {
					return callback(null, requestForQuote.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		featuredProducts: function(callback) {
			const tempLimit = 6;
			delete queryObj['marketplace_type_id'];
			queryObj['position'] = 'position_wholesale_landing';
			queryObj['is_featured_product'] = 1;

			productService.queryAllProducts(LoggedInUser.id, queryObj, 0, tempLimit)
				.then(function(results) {
					if(results.count > 0 ){
						var featureIds = [];
						for (var i = 0; i < results.rows.length; i++) { 
							featureIds.push(results.rows[i].FeaturedProducts[0].id);
						}
						model['FeaturedProduct'].increment({
							'impression': 1
						}, {
							where: {
								id: featureIds
							}
						}).then(function(updatedRow){
							console.log("Impression Response::", updatedRow);
						}).catch(function(error){
							console.log("Error::", error);
						})
					}
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});

		},
		country: function(callback) {
			const tempLimit = null;
			delete queryObj['marketplace_id'];
			delete queryObj['position'];
			delete queryObj['is_featured_product'];

			service.findRows(countryModel, queryObj, offset, tempLimit, 'id', 'asc')
				.then(function(country) {
					return callback(null, country.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		type: function(callback) {
			const tempLimit = null;

			service.findRows(typeModel, queryObj, offset, tempLimit, 'id', 'asc')
				.then(function(type) {
					return callback(null, type.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wholesalers: function(callback) {
			vendorService.TopSellingVendors(0, 6, marketplace['WHOLESALE'])
				.then((response) => {
					return callback(null, response.rows);
				})
				.catch((error) => {
					console.log("wholesalers Error:::", error);
					return callback(error);
				});
		},
		wholesalerCount: function(callback){
			var planQuery={};
			planQuery['plan_id']=plan['WHOLESALER'];
			productService.sellersCount(planQuery)
			.then((response)=>{
				return callback(null,response)
			}).catch((error)=>{
				console.log("Error:::", error);
					return callback(error);
			})

		},
		wholesaleProductCount: function(callback){
			var marketplaceQuery={
				marketplace_id:marketplace['WHOLESALE']
			}
			productService.productCount(marketplaceQuery)
			.then((response)=>{

				return callback(null,response)
			}).catch((error)=>{
				console.log("Error:::", error);
					return callback(error);
			})
		},
		wholesaleRandomAd: function(callback) {
			var queryObj = {};
			queryObj['position'] = position['WHOLESALE'].id;
			model[productAdModelName].findOne({
				order: [
					[sequelize.literal('RAND()')]
				],
				limit: 1,
				where: queryObj
			}).then(function(row) {
				if (row) {
					model[productAdModelName].increment({
						'impression': 1
					}, {
						where: {
							id: row.id
						}
					}).then(function(updatedRow){
						console.log("Impression Response::", updatedRow);
					}).catch(function(error){
						console.log("Error::", error);
					})
					return callback(null, row.toJSON());
				} else {
					return callback(null);
				}
			}).catch(function(error) {
				return callback(error);
			});
		},
	}, function(err, results) {
		if (!err) {
			res.render('wholesale', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				wantToSell: results.wantToSell,
				wantToBuy: results.wantToBuy,
				wantToTrade: results.wantToTrade,
				requestForQuote: results.requestForQuote,
				featuredProducts: results.featuredProducts,
				wholesalers: results.wholesalers,
				country: results.country,
				cart: results.cartInfo,
				type: results.type,
				LoggedInUser: LoggedInUser,
				wholesaleProductCount: results.wholesaleProductCount,
				wholesalerCount: results.wholesalerCount,
				wholesaleRandomAd:results.wholesaleRandomAd
			});
		} else {
			res.render('wholesale', err);
		}
	});
}