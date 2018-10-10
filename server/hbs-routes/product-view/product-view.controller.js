'use strict';

const _ = require('lodash');
const async = require('async');
var auth = require('../../auth/auth.service');
var productService = require('../../api/product/product.service')
const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const verificationStatus = require('../../config/verification_status');
const position = require('../../config/position');
const service = require('../../api/service');
const categoryService = require('../../api/category/category.service');
const sequelize = require('sequelize');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const wholesaleTypes = require('../../config/marketplace_type');
const Plan = require('../../config/gtc-plan');

export function product(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var productModel = 'MarketplaceProduct';
	var wishlistModel = 'WishList';
	var vendorID, productID, categoryID, marketplaceID;
	if (req.params.product_id) {
		productID = req.params.product_id;
	}

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}
	async.series({
			cartInfo: function(callback) {
				if (LoggedInUser.id) {
					cartService.cartCalculation(LoggedInUser.id, req)
						.then((cartResult) => {
							return callback(null, cartResult);
						}).catch((error) => {
							return callback(error);
						});
				} else {
					return callback(null);
				}
			},
			productWishlist(callback) {
				if (req['currentUser']) {
					var queryObj = {};
					var includeArr = [];

					queryObj['user_id'] = req['currentUser'].id;
					queryObj['product_id'] = productID;
					queryObj['status'] = status['ACTIVE'];

					service.findOneRow(wishlistModel, queryObj, includeArr).then(function(exists) {
						if (exists) {
							return callback(null, exists);
						} else {
							return callback(null);
						}
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
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
			productDetail: function(callback) {
				productService.productView(productID)
					.then((product) => {
						if (product.Reviews.length > 0) {
							var newProductRating = parseFloat(product.Reviews[0].productRating);
							product['rating'] = newProductRating.toFixed(1);
						} else {
							product['rating'] = 0;
						}
						vendorID = product.vendor_id;
						marketplaceID = product.marketplace_id;
						categoryID = product.product_category_id;
						return callback(null, product);
					}).catch((error) => {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			productRating: function(callback) {
				productService.productRatingsCount(productID)
					.then((productRatings) => {
						return callback(null, productRatings);
					}).catch((error) => {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			productRecentReview: function(callback) {
				var queryObj = {};

				queryObj['status'] = status['ACTIVE'];
				queryObj['product_id'] = productID;

				productService.productReviews(queryObj, null, 1, 'created_on', 'DESC')
					.then((productLatestReview) => {
						return callback(null, productLatestReview);
					}).catch((error) => {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			RelatedProducts: function(callback) {
				var offset = 0;
				var limit=9;
				var queryObj = {
					product_category_id: categoryID,
					vendor_id: vendorID,
					id: {
						$ne: productID
					}
				};
				if(marketplaceID ==marketplace['WHOLESALE']){
					queryObj['marketplace_id']= {
						$eq: marketplace['WHOLESALE']
					}
				}else{
					queryObj['marketplace_id']= {
						$ne: marketplace['WHOLESALE']
					}
				}
				productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit)
				.then(function(publicMarketplace) {
					console.log(publicMarketplace);
					return callback(null, publicMarketplace);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});

			},
			VendorDetail: function(callback) {
				var vendorIncludeArr = [{
					model: model['User'],
					attributes: {
						exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
					}
				}, {
					model: model['Country']
				}, {
					model: model['VendorPlan'],
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
						user_id: LoggedInUser.id,
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
				},{
					model: model['TalkSetting'],
					where:{
						gtc_talk_enabled: status['ACTIVE']
					}
				}];
				service.findIdRow('Vendor', vendorID, vendorIncludeArr)
					.then(function(response) {
						return callback(null, response);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			categoriesWithCount: function(callback) {
				var queryObj = {};
				var productQueryObj = {};

				queryObj['status'] = status['ACTIVE'];
				productQueryObj['status'] = status['ACTIVE'];

				if (vendorID) {
					productQueryObj['vendor_id'] = vendorID;
				}
				// productQueryObj['marketplace_id'] = 1;
				categoryService.categoriesWithProductCount(queryObj, productQueryObj)
					.then((response) => {
						return callback(null, response);
					}).catch((error) => {
						console.log("categoriesWithProductCount Error:::", error);
						return callback(null);
					});
			},
			categoryWithProductCount: function(callback) {
				var queryObj = {};
				var productQueryObj = {};

				queryObj['status'] = status['ACTIVE'];
				productQueryObj['status'] = status['ACTIVE'];

				if (vendorID) {
					productQueryObj['vendor_id'] = vendorID;
				}

				var resultObj = {};
				categoryService.productViewCategoryProductCount(queryObj, productQueryObj)
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
			marketPlaceTypes: function(callback) {
				if (marketplaceID == marketplace['WHOLESALE']) {
					var marketplaceTypeQueryObj = {};
					var productCountQueryParames = {};

					marketplaceTypeQueryObj['status'] = status["ACTIVE"];
					productCountQueryParames['vendor_id'] = vendorID;
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
				} else {
					return callback(null);
				}
			},
			talkThreads: function(callback) {
				var includeArr = [];
				if (LoggedInUser.id != null && vendorID != LoggedInUser.Vendor.id) {
					service.findOneRow('Vendor', vendorID, includeArr)
						.then(function(response) {
							var talkIncludeArr = [];
							var talkThreadUsersQueryObj = {};

							talkThreadUsersQueryObj['user_id'] = {
								'$in': [response.user_id, LoggedInUser.id]
							}
							model['TalkThreadUsers'].findAll({
								where: talkThreadUsersQueryObj,
								attributes: ['id', 'thread_id', 'user_id']
							}).then(function(instance) {
								var talkUserCheck = JSON.parse(JSON.stringify(instance));

								var threadArr = _.intersection(_.map(_.filter(talkUserCheck, function(o) {
									return o.user_id == response.user_id;
								}), 'thread_id'), _.map(_.filter(talkUserCheck, function(o) {
									return o.user_id == LoggedInUser.id;
								}), 'thread_id'));
								if (threadArr.length > 0) {
									var talkThread = {};
									talkThread['talk_thread_id'] = threadArr[0];
									model['Talk'].findAll({
										where: talkThread
									}).then(function(talk) {
										if (talk.length > 0) {
											callback(null, {
												threadId: threadArr[0],
												talk: JSON.parse(JSON.stringify(talk))
											});
										} else {

											
											callback(null, {
												threadId: threadArr[0],
												talk: JSON.parse(JSON.stringify(talk))
											});
										}
									}).catch(function(err) {
										console.log("Error:::", err);
									})
								} else {
									var bodyParams = {};
									bodyParams['talk_thread_status'] = 1;
									bodyParams['status'] = 1;
									model['TalkThread'].create(bodyParams).then(function(talkThread) {
										if (talkThread) {
											var talkThreadJSON = JSON.parse(JSON.stringify(talkThread));
											var talkTreadModel = 'TalkThreadUsers';
											var talkThreadUserObj = [{
												'talk_thread_status': 1,
												'status': 1,
												'thread_id': talkThreadJSON.id,
												'user_id': LoggedInUser.id
											}, {
												'talk_thread_status': 1,
												'status': 1,
												'thread_id': talkThreadJSON.id,
												'user_id': response.user_id
											}];

											service.createBulkRow(talkTreadModel, talkThreadUserObj)
												.then(function(talkThreadUser) {
													callback(null, {
														talkThread: talkThreadJSON.id,
														threadId: talkThreadJSON.id,
														talk: null
													})
												})
												.catch(function(err) {
													callback(null);
												})


										}
									}).catch(function(err) {
										console.log("err", err)
									})
								}

							}).catch(function(error) {
								console.log("Error:::", error);
								return callback(null);
							})
						}).catch(function(error) {
							console.log("Error:::", error);
							return callback(null);
						})
				} else {
					return callback(null);
				}
			},
			VendorAvgRating: function(callback) {
				var vendorAvgRating = {};
				vendorAvgRating['vendor_id'] = vendorID;

				vendorAvgRating['status'] = {
					'$eq': status["ACTIVE"]
				}
				model['ProductRatings'].findAll({
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

		},
		function(error, results) {
			var selectedPage;
			if (marketplaceID == marketplace['WHOLESALE']) {
				selectedPage = "wholesale";
			} else if (marketplaceID == marketplace['PUBLIC']) {
				selectedPage = "shop";
			} else if (marketplaceID == marketplace['SERVICE']) {
				selectedPage = "services";
			} else if (marketplaceID == marketplace['LIFESTYLE']) {
				selectedPage = "lifestyle";
			} else {
				selectedPage = null;
			}
			if (!error) {
				res.render('product-view', {
					title: "Global Trade Connect",
					categories: results.categories,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					product: results.productDetail,
					RelatedProducts: results.RelatedProducts,
					isWishlist: results.productWishlist,
					productRatings: results.productRating,
					productRecentReview: results.productRecentReview,
					VendorDetail: results.VendorDetail,
					categoriesWithCount: results.categoriesWithCount,
					marketPlaceTypes: results.marketPlaceTypes,
					wholesaleTypes: wholesaleTypes,
					talkThreads: results.talkThreads,
					status: status,
					LoggedInUser: LoggedInUser,
					selectedPage: selectedPage,
					Plan: Plan,
					marketplace:marketplace,
					VendorAvgRating: results.VendorAvgRating,
					categoryWithProductCount: results.categoryWithProductCount
				});
			} else {
				res.render('product-view', {
					title: "Global Trade Connect"
				});
			}
		});
}

export function GetProductReview(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var productID, vendorID, marketplaceID;

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}

	if (req.params.product_id) {
		productID = req.params.product_id;
	}

	var page;
	var queryURI = {};
	var queryPaginationObj = {};
	var offset, limit, field, order;

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 5;
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

	async.series({
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id, req)
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
		productDetail: function(callback) {
			model['Product'].findOne({
				where: {
					id: productID
				},
				attributes: ['id', 'product_name', 'product_slug', 'vendor_id', 'marketplace_id'],
				include: [{
					model: model['ProductMedia'],
					where: {
						status: status['ACTIVE']
					},
					// limit: 1,
					// offset: 0,
					attributes: ['id', 'product_id', 'type', 'url', 'base_image', 'status']
				}, {
					model: model['Review'],
					where: {
						status: status['ACTIVE']
					},
					attributes: [
						[sequelize.fn('AVG', sequelize.col('Reviews.rating')), 'product_rating'],
						[sequelize.fn('COUNT', sequelize.col('Reviews.id')), 'product_rating_count']
					],
					group: ['Reviews.user_id'],
					required: false
				}]
			}).then((response) => {
				if (response) {
					var productResponse = response.toJSON();
					vendorID = productResponse.vendor_id;
					marketplaceID = productResponse.marketplace_id;
					productID = productResponse.id;
					productResponse['media'] = {};
					productResponse['rating'] = {};
					productResponse['rating'].product_rating = 0;
					productResponse['rating'].product_rating_count = 0;

					if (productResponse.ProductMedia.length > 0) {
						productResponse['media'] = productResponse.ProductMedia[0];
						delete productResponse['ProductMedia'];
					}
					if (productResponse.Reviews.length > 0) {
						productResponse['rating'].product_rating = parseFloat(productResponse.Reviews[0].product_rating).toFixed(1);
						productResponse['rating'].product_rating_count = productResponse.Reviews[0].product_rating_count;
						delete productResponse['Reviews'];
					}
					return callback(null, productResponse);
				} else {
					return callback(null, null);
				}
			}).catch((error) => {
				console.log('Product findOne Error:::', error);
				return callback(null);
			});
		},
		productReviews: function(callback) {
			var queryObj = {};

			queryObj['status'] = status['ACTIVE'];
			queryObj['product_id'] = productID;
			productService.productReviews(queryObj, offset, limit, 'created_on', 'DESC')
				.then((productLatestReview) => {
					return callback(null, productLatestReview);
				}).catch((error) => {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		categoriesWithCount: function(callback) {
			var queryObj = {};
			var productQueryObj = {};

			queryObj['status'] = status['ACTIVE'];
			productQueryObj['status'] = status['ACTIVE'];

			if (vendorID) {
				productQueryObj['vendor_id'] = vendorID;
			}

			categoryService.categoriesWithProductCount(queryObj, productQueryObj)
				.then((response) => {
					return callback(null, response);
				}).catch((error) => {
					console.log("categoriesWithProductCount Error:::", error);
					return callback(null);
				});
		},
		categoryWithProductCount: function(callback) {
			var queryObj = {};
			var productQueryObj = {};

			queryObj['status'] = status['ACTIVE'];
			productQueryObj['status'] = status['ACTIVE'];

			if (vendorID) {
				productQueryObj['vendor_id'] = vendorID;
			}

			var resultObj = {};
			categoryService.productViewCategoryProductCount(queryObj, productQueryObj)
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
		productRating: function(callback) {
			productService.productRatingsCount(productID)
				.then((productRatings) => {
					return callback(null, productRatings);
				}).catch((error) => {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		VendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']
			}, {
				model: model['VendorPlan'],
			}, {
				model: model['VendorVerification'],
				where: {
					vendor_verified_status: verificationStatus['APPROVED']
				},
				required: false
			}, {
				model: model['VendorFollower'],
				where: {
					user_id: LoggedInUser.id,
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
			service.findIdRow('Vendor', vendorID, vendorIncludeArr)
				.then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		VendorAvgRating: function(callback) {
			var vendorAvgRating = {};
			vendorAvgRating['vendor_id'] = vendorID;

			vendorAvgRating['status'] = {
				'$eq': status["ACTIVE"]
			}
			model['ProductRatings'].findAll({
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
	}, function(error, results) {
		var selectedPage;
		queryPaginationObj['maxSize'] = 2;
		if (marketplaceID == marketplace['WHOLESALE']) {
			selectedPage = "wholesale";
		} else if (marketplaceID == marketplace['PUBLIC']) {
			selectedPage = "shop";
		} else if (marketplaceID == marketplace['SERVICE']) {
			selectedPage = "services";
		} else if (marketplaceID == marketplace['LIFESTYLE']) {
			selectedPage = "lifestyle";
		} else {
			selectedPage = null;
		}
		if (!error && results) {
			res.render('product-review', {
				title: "Global Trade Connect",
				cart: results.cartInfo,
				marketPlace: marketplace,
				categories: results.categories,
				bottomCategory: bottomCategory,
				product: results.productDetail,
				productReviews: results.productReviews,
				productRatings: results.productRating,
				VendorDetail: results.VendorDetail,
				categoriesWithCount: results.categoriesWithCount,
				LoggedInUser: LoggedInUser,
				selectedPage: selectedPage,
				queryURI: queryURI,
				queryPaginationObj: queryPaginationObj,
				urlPathname: req.path,
				status: status,
				Plan: Plan,
				VendorAvgRating: results.VendorAvgRating,
				categoryWithProductCount: results.categoryWithProductCount

			});
		} else {
			res.render('product-review', {
				title: "Global Trade Connect"
			});
		}
	});
}