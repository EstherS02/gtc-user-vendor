'use strict';

const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');
const sequelize = require('sequelize');
const marketplace = require('../../config/marketplace');
const async = require('async');
const _ = require('lodash');

export function GetProductDetails(req, res) {

	var queryObj = {};
	var includeArr = [];
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}

	if (req.params.product_id)
		queryObj['id'] = req.params.product_id;

	if (req.params.product_slug)
		queryObj['product_slug'] = req.params.product_slug;
	queryObj['status'] = status["ACTIVE"];
	var wishQueryObj = {};
	if (LoggedInUser.id) {
		wishQueryObj = {
			user_id: LoggedInUser.id,
			status: {
				'$eq': status["ACTIVE"]
			}
		}
	}
	var sub_category, vendor_id, marketplace_id;
	var productModel = 'MarketplaceProduct';
	var order = "desc";
	var field = "created_on";
	var product_id;
	var queryURI = {};
	async.series({
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
		Product: function(callback) {
			var includeArr1 = [{
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
				model: model["WishList"],
				where: wishQueryObj,
				required: false
			}, {
				model: model["ProductMedia"],
				where: {
					status: {
						'$eq': status["ACTIVE"]
					}
				}
			}];
			service.findOneRow('Product', queryObj, includeArr1)
				.then(function(product) {
					sub_category = product.sub_category_id;
					marketplace_id = product.marketplace_id;
					vendor_id = product.vendor_id;
					return callback(null, product);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		AllReviews: function(callback) {
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
			service.findAllRows(reviewModel, includeArr2, queryObj1, null, null, 'rating', 'desc')
				.then(function(AllReviews) {
					return callback(null, AllReviews);
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
					vendor_verified_status: status['ACTIVE']
				},
				required: false

			}, {
				model: model['VendorRating'],
				attributes: [
					[sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating']
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
			includeArr = [];
			service.findAllRows(productModel, includeArr, queryObj2, 0, 9, field, order)
				.then(function(RelatedProducts) {
					return callback(null, RelatedProducts);
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
		marketPlaceTypes: function(callback) {
			if (marketplace_id == marketplace['WHOLESALE']) {
				var result = {};
				var marketplaceTypeQueryObj = {};
				var productCountQueryParames = {};

				marketplaceTypeQueryObj['status'] = status["ACTIVE"];
				productCountQueryParames['vendor_id'] = vendor_id;
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
	}, function(err, results) {
		queryURI['marketplace_id'] = results.Product.Marketplace.id;
		var productsList = JSON.parse(JSON.stringify(results.Product));

		let productReviewsList = _.groupBy(results.AllReviews.rows, "rating");
		var selectedPage;
		if (productsList.Marketplace.id == 1) {
			selectedPage = "wholesale";
		} else if (productsList.Marketplace.id == 2) {
			selectedPage = "shop";
		} else if (productsList.Marketplace.id == 3) {
			selectedPage = "services";
		} else {
			selectedPage = "lifestyle";
		}
		if (!err) {
			var productRating = [{
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
			var rating = results.AllReviews.rows;

			for (let key in rating) {
				total = total + rating[key].rating;
				if (rating[key].rating <= 5)
					productRating[5 - rating[key].rating].ratingCount = productRating[5 - rating[key].rating].ratingCount + 1;
			}
			var productAvgRating = (total > 0) ? (total / rating.length).toFixed(1) : 0;

			res.render('product-view', {
				categories: results.categories,
				bottomCategory: bottomCategory,
				product: productsList,
				productReviewsList: results.AllReviews,
				LoggedInUser: LoggedInUser,
				rating: productRating,
				status: status,
				VendorDetail: results.VendorDetail,
				wishList: productsList.WishLists,
				avgRating: productAvgRating,
				queryURI: queryURI,
				categoriesWithCount: results.categoriesWithCount,
				RelatedProducts: results.RelatedProducts.rows,
				marketPlaceTypes: results.marketPlaceTypes,
				marketplace: marketplace,
				selectedPage: selectedPage,
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser
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
	var queryParams = {};
	var sub_category;
	var vendor_id;
	var marketplace_id;
	var page;
	var offset;
	var order;
	var limit;
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
					vendor_verified_status: status['ACTIVE']
				},
				required: false

			}, {
				model: model['VendorRating'],
				attributes: [
					[sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating']
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
		category: function(callback) {
			service.findRows("Category", {}, 0, null, 'id', 'asc')
				.then(function(category) {
					return callback(null, category.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}

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
				if (rating[key].rating <= 5)
					productRating[5 - rating[key].rating].ratingCount = productRating[5 - rating[key].rating].ratingCount + 1;
			}
			var productAvgRating = (total > 0) ? (total / rating.length).toFixed(1) : 0;

			productRating = productRating;

			res.render('product-review', {
				title: "Global Trade Connect",
				product: results.Product,
				Reviews: results.Review.rows,
				LoggedInUser: LoggedInUser,
				Rating: productRating,
				AvgRating: productAvgRating,
				RelatedProducts: results.RelatedProducts.rows,
				queryPaginationObj: queryPaginationObj,
				ratingCount: results.Review.count,
				VendorDetail: results.VendorDetail,
				categories: results.categories,
				queryURI: queryURI,
				category: results.category,
				selectedPage: selectedPage,
				page: page,
				pageCount: results.Review.count - offset,
				maxSize: maxSize,
				pageSize: limit,
				collectionSize: results.Review.count,
				queryParams: queryParams,
			});
		} else {
			res.render('product-review', {
				title: "Global Trade Connect"
			});
		}
	});
}