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
const sequelize = require('sequelize');
const marketplace = require('../../config/marketplace');
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
		cartCounts: function(callback) {
			if (req['currentUser']) {
				service.cartHeader(LoggedInUser).then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
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
			var order = "desc";
			var includeArr = [];
			var field = "created_on";
			var queryObj = {
				category_id: categoryID,
				vendor_id: vendorID,
				id: {
					$ne: productID
				}
			};

			service.findAllRows(productModel, includeArr, queryObj, 0, 9, field, order)
				.then(function(RelatedProducts) {
					return callback(null, RelatedProducts);
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
			var result = {};
			var categoryQueryObj = {};
			var productCountQueryParames = {};

			categoryQueryObj['status'] = status["ACTIVE"];
			productCountQueryParames['status'] = status["ACTIVE"];
			if (vendorID) {
				productCountQueryParames['vendor_id'] = vendorID;
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
		}
	}, function(error, results) {
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
			console.log(JSON.parse(JSON.stringify(results.productDetail)))
			res.render('product-view', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				cartheader: results.cartCounts,
				product: results.productDetail,
				isWishlist: results.productWishlist,
				productRatings: results.productRating,
				productRecentReview: results.productRecentReview,
				VendorDetail: results.VendorDetail,
				categoriesWithCount: results.categoriesWithCount,
				marketPlaceTypes: results.marketPlaceTypes,
				status: status,
				LoggedInUser: LoggedInUser,
				selectedPage: selectedPage,
				Plan: Plan
			});
		} else {
			res.render('product-view', {
				title: "Global Trade Connect"
			});
		}
	});
}

export function GetProductReview(req, res) {
	var queryObj = {};
	var includeArr = [];
	var LoggedInUser = {};
	var queryPaginationObj = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var queryParams = {};
	var sub_category;
	var vendor_id;
	var marketplace_id;
	var page;
	var offset;
	var order;
	var limit;
	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 5;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	delete req.query.page;
	var field = "id";
	var queryURI = {};
	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;
	var maxSize;
	var productModel = 'Product';
	var followQuery = {};
	if (LoggedInUser.id) {
		followQuery = {
			status: status['ACTIVE'],
			user_id: LoggedInUser.id,
		};
	} else {
		followQuery = {
			status: status['ACTIVE']
		};
	}

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}
	if (req.params.product_id)
		queryParams['id'] = req.params.product_id;


	if (req.params.product_slug)
		queryParams['product_slug'] = req.params.product_slug;

	queryObj['status'] = status["ACTIVE"];
	var includeArr = [];

	async.series({
		cartCounts: function(callback) {
			service.cartHeader(LoggedInUser).then(function(response) {
				return callback(null, response);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		Product: function(callback) {
			var includeArr1 = [{
				model: model["ProductMedia"],
				where: {
					status: {
						'$eq': status["ACTIVE"]
					}
				}
			}];
			var id = {
				id: req.params.product_id
			}
			service.findRow(productModel, id, includeArr1)
				.then(function(product) {
					sub_category = product.sub_category_id;
					vendor_id = product.vendor_id;
					return callback(null, product);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		Review: function(callback) {
			var reviewModel = "Review";
			var queryObj1 = {
				product_id: req.params.product_id,
				status: status["ACTIVE"]
			}
			var includeArr2 = [{
				model: model["User"],
				attributes: {
					exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
				}
			}];
			service.findAllRows(reviewModel, includeArr2, queryObj1, offset, limit, field, order)
				.then(function(Reviews) {
					return callback(null, Reviews);

				}).catch(function(error) {
					console.log('Error :::', error);
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
					// vendor_verified_status: status['ACTIVE']
					vendor_verified_status: verificationStatus['APPROVED']
				},
				required: false

			}, {
				model: model['VendorFollower'],
				where: followQuery,
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
		RelatedProducts: function(callback) {
			var queryObj2 = {
				sub_category_id: sub_category,
				vendor_id: vendor_id,
				id: {
					$ne: req.params.product_id
				}
			};
			includeArr = [{
				model: model["Vendor"]
			}, {
				model: model["Marketplace"]
			}, {
				model: model["MarketplaceType"]
			}, {
				model: model["Category"]
			}, {
				model: model["SubCategory"]
			}, {
				model: model["Country"]
			}, {
				model: model["State"]
			}, {
				model: model["ProductMedia"],
				where: {
					status: {
						'$eq': status["ACTIVE"]
					}
				}
			}];
			service.findAllRows(productModel, includeArr, queryObj2, 0, 9, field, order)
				.then(function(RelatedProducts) {
					return callback(null, RelatedProducts);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
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
		categoriesWithCount: function(callback) {
			var result = {};
			var categoryQueryObj = {};
			var productCountQueryParames = {};

			categoryQueryObj['status'] = status["ACTIVE"];
			productCountQueryParames['status'] = status["ACTIVE"];
			if (vendor_id) {
				productCountQueryParames['vendor_id'] = vendor_id;
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

	}, function(err, results) {
		queryURI['marketplace_id'] = results.Product.marketplace_id;


		if (!err) {
			var selectedPage;
			if (results.Product.marketplace_id == 1) {
				selectedPage = "wholesale";
			} else if (results.Productmarketplace_id == 2) {
				selectedPage = "shop";
			} else if (results.Product.marketplace_id == 3) {
				selectedPage = "services";
			} else {
				selectedPage = "lifestyle";
			}

			maxSize = results.Review.count / limit;
			if (results.Review.count % limit)
				maxSize++;

			var productRating = [{
				starCount: 7,
				ratingCount: 0
			}, {
				starCount: 6,
				ratingCount: 0
			}, {
				starCount: 5,
				ratingCount: 0
			}, {
				starCount: 4,
				ratingCount: 0
			}, {
				starCount: 3,
				ratingCount: 0
			}, {
				starCount: 2,
				ratingCount: 0
			}, {
				starCount: 1,
				ratingCount: 0
			}];

			var total = 0;
			var rating = results.Review.rows;

			for (let key in rating) {
				total = total + rating[key].rating;
				if (rating[key].rating <= 7)
					productRating[7 - rating[key].rating].ratingCount = productRating[7 - rating[key].rating].ratingCount + 1;
			}
			var productAvgRating = (total > 0) ? (total / rating.length).toFixed(1) : 0;

			productRating = productRating;

			res.render('product-view', {
				title: "Global Trade Connect",
				product: results.Product,
				Reviews: results.Review.rows,
				LoggedInUser: LoggedInUser,
				Rating: productRating,
				bottomCategory: bottomCategory,
				categoriesWithCount: results.categoriesWithCount,
				AvgRating: productAvgRating,
				RelatedProducts: results.RelatedProducts.rows,
				queryPaginationObj: queryPaginationObj,
				ratingCount: results.Review.count,
				VendorDetail: results.VendorDetail,
				categories: results.categories,
				queryURI: queryURI,
				selectedPage: selectedPage,
				page: page,
				pageCount: results.Review.count - offset,
				maxSize: maxSize,
				pageSize: limit,
				collectionSize: results.Review.count,
				queryParams: queryParams,
				cartheader: results.cartCounts,
				Plan: Plan,
			});
		} else {
			res.render('product-view', {
				title: "Global Trade Connect"
			});
		}
	});
}