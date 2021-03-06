'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const status = require('../../../config/status');
const verificationStatus = require('../../../config/verification_status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const marketplace_type = require('../../../config/marketplace_type');
const Plan = require('../../../config/gtc-plan');
const productService = require('../../../api/product/product.service');
const moment = require('moment');
var async = require('async');

export function vendor(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	var productModel = "MarketplaceProduct";
	var categoryModel = "Category";
	var bottomCategory = {};
	var offset = 0;
	var limit;
	var field = "created_on";
	var order = "desc"
	var queryObj = {};
	var vendor_id = req.params.id;
	queryObj['vendor_id'] = vendor_id;

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
		vendorPlan: function(callback) {
			var queryObj = {};
			queryObj['start_date'] = {
					'$lte': moment().format('YYYY-MM-DD')
				};
				queryObj['end_date'] = {
					'$gte': moment().format('YYYY-MM-DD')
				};
			queryObj['status'] = status['ACTIVE'];
			queryObj['vendor_id'] = vendor_id;
			var includeArr = [];
			service.findRow('VendorPlan', queryObj, includeArr)
				.then(function(response) {
					return callback(null, response);

				}).catch(function(error) {
					return callback(null);
				});
		},
		featuredProducts: function(callback) {
			queryObj['position'] = 'position_profilepage';
			queryObj['is_featured_product'] = 1;
			limit = 2;
			productService.queryAllProducts(LoggedInUser.id, queryObj, 0, limit)
				.then(function(results) {
					if (results.count == 0) {
						delete queryObj['position'];
						delete queryObj['is_featured_product'];
						productService.queryAllProducts(LoggedInUser.id, queryObj, 0, limit)
							.then(function(results) {
								
								return callback(null, results);
							});
					} else {
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
						return callback(null, results);
					}
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		topSelling: function(callback) {
			delete queryObj['is_featured_product'];

			queryObj['vendor_id'] = vendor_id;
			field = 'product_selling_count';
			order = 'desc';
			limit = 3;
			productService.OnSale('product', queryObj, limit)
				.then(function(servicesProviders) {

					return callback(null, servicesProviders.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		topRating: function(callback) {
			delete queryObj['featured_position'];
			delete queryObj['is_featured_product'];
			delete queryObj['exclusive_sale'];
			delete queryObj['exclusive_start_date'];
			delete queryObj['exclusive_end_date'];

			queryObj['vendor_id'] = vendor_id;
			limit = 3;
			productService.TopRated('product', queryObj, limit)
				.then(function(servicesProviders) {

					return callback(null, servicesProviders.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		VendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],
				where: {
					status: status['ACTIVE'],
					start_date: {
						'$lte': moment().format('YYYY-MM-DD')
					},
					end_date: {
						'$gte': moment().format('YYYY-MM-DD')
					}
				},

				required: false
			}, {
				model: model['VendorVerification'],
				where: {
					// vendor_verified_status: status['ACTIVE']
					vendor_verified_status: verificationStatus['APPROVED']
				},
				required: false
			}, {
				model: model['VendorFollower'],
				where: {
					user_id: req.user.id,
					status: 1
				},
				required: false
			}, {
				model: model['VendorRating'],
				attributes: [
					[sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating'],
					[sequelize.fn('count', sequelize.col('VendorRatings.rating')), 'count']
				],
				group: ['VendorRating.vendor_id'],
				required: false,
			}];
			service.findIdRow('Vendor', vendor_id, vendorIncludeArr)
				.then(function(response) {
					return callback(null, response);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		VendorAvgRating: function(callback) {
			var vendorAvgRating = {};
			vendorAvgRating['vendor_id'] = vendor_id;

			vendorAvgRating['status'] = {
				'$eq': status["ACTIVE"]
			}

			model['ProductRating'].findAll({
				where: vendorAvgRating,
				attributes: [
					[sequelize.fn('AVG', sequelize.col('product_rating')), 'rating']
				],
			}).then(function(data) {
				var result = JSON.parse(JSON.stringify(data));
				return callback(null, result);
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
		},
		Rating: function(callback) {
			model['Review'].findAndCountAll({
				include:[{
					model: model['Product'],
					where:{
						vendor_id: vendor_id
					}
				}],
				attributes: [
					'rating', 'title', 'comment', 'created_on', 'id', [sequelize.fn('COUNT', sequelize.col('Review.user_id')), 'userCount']
				],
				group: ['Review.rating']

			}).then(function(Reviews) {
				var productRating = [{
					"rating": 7,
					"userCount": 0
				}, {
					"rating": 6,
					"userCount": 0
				}, {
					"rating": 5,
					"userCount": 0
				}, {
					"rating": 4,
					"userCount": 0
				}, {
					"rating": 3,
					"userCount": 0
				}, {
					"rating": 2,
					"userCount": 0
				}, {
					"rating": 1,
					"userCount": 0
				}];
				var total = 0;
				var totalAmt = 0;
				var responseRatings = JSON.parse(JSON.stringify(Reviews.rows));
				if (responseRatings.length > 0) {
					for (var i = 0; i < productRating.length; i++) {
						for (var j = 0; j < responseRatings.length; j++) {
							if (productRating[i].rating == responseRatings[j].rating) {
								total = total + responseRatings[j].userCount;
								totalAmt = totalAmt + (responseRatings[j].userCount * responseRatings[j].rating)
								productRating[i].userCount = responseRatings[j].userCount;
							}
						}
					}
				}
				Reviews.productRating = productRating;
				Reviews.avgRating = (totalAmt > 0) ? (totalAmt / total).toFixed(1) : 0;
				var counts = JSON.parse(JSON.stringify(Reviews.count));
				var count = 0;

				if (counts.length > 0) {
					for (var a = 0; a < counts.length; a++) {
						count = count + counts[a].count;
					}
				}
				Reviews.totalCount = count;
				return callback(null, Reviews);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		}
	}, function(err, results) {
		if (!err) {
			res.render('vendorPages/vendor', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				VendorDetail: results.VendorDetail,
				featuredProducts: results.featuredProducts,
				topSelling: results.topSelling,
				topRating: results.topRating,
				cart: results.cartInfo,
				marketPlace: marketplace,
				LoggedInUser: LoggedInUser,
				Plan: Plan,
				avgRating: results.Rating.avgRating,
				ratingCount: results.Rating.totalCount,
				VendorAvgRating: results.VendorAvgRating
			});
		} else {
			res.render('404');
		}
	});
}