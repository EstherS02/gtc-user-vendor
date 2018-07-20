'use strict';

const async = require('async');

const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const statusCode = require('../../config/status');
const discountType = require('../../config/discount');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const vendorPlan = require('../../config/gtc-plan');

export function coupons(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	console.log(req.user)

	let user_id = LoggedInUser.id;

	var field = 'id';
	var order = "desc";
	var offset = 0;
	var limit = 10;
	var queryObj = {};
	var bottomCategory ={};
	var couponModel = 'Coupon';

	if (typeof req.query.limit !== 'undefined') {
		limit = req.query.limit;
		limit = parseInt(limit);
	}
	if (typeof req.query.status !== 'undefined') {
		var statusNew = '';
		if (statusNew = status[req.query.status])
			queryObj['status'] = parseInt(statusNew);
	}
	if (typeof req.query.name !== 'undefined') {
		queryObj['coupon_name'] = {
			$like: '%' + req.query.name + '%'
		};
	}
	//pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	delete req.query.order;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;
	// End pagination
	queryObj['vendor_id'] = req.user.Vendor.id;

	console.log('queryObj', queryObj);
	 var queryObjCategory = {
        status: status['ACTIVE']
    };
	async.series({
			Coupons: function(callback) {
				service.findRows(couponModel, queryObj, offset, limit, field, order)
					.then(function(response) {
						return callback(null, response);

					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
		categories: function(callback) {
			var categoryModel = "Category";
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
		}

		},
		function(err, results) {
			if (!err) {
				maxSize = results.Coupons.count / limit;
				if (results.Coupons.count % limit)
					maxSize++;
				res.render('vendorNav/coupons/view-coupons', {
					title: "Global Trade Connect",
					Coupons: results.Coupons.rows,
					count: results.Coupons.count,
					statusCode: status,
					discountType: discountType,
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					selectedPage:'coupons',
					// pagination
					page: page,
					maxSize: maxSize,
					pageSize: limit,
					collectionSize: results.count,
					// End pagination
					vendorPlan:vendorPlan
				});
			} else {
				res.render('vendorNav/coupons/view-coupons', err);
			}
		});
}

export function addCoupon(req, res) {

	var LoggedInUser = {};
	if (req.user)
		LoggedInUser = req.user;
	let user_id = LoggedInUser.id;

	var productModel = "Product";
	var categoryModel = "Category";

	var offset, limit, field, order;
	var productQueryObj = {};
	var categoryQueryObj = {};
	var bottomCategory={};
	field = "id";
	order = "asc";

	productQueryObj['status'] = status["ACTIVE"];
	categoryQueryObj['status'] = status["ACTIVE"];
	
	productQueryObj['vendor_id'] = req.user.Vendor.id;

	async.series({
		products: function(callback) {
			service.findRows(productModel, productQueryObj, offset, limit, field, order)
				.then(function(products) {
					return callback(null, products.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},

			categories: function(callback) {
			var categoryModel = "Category";
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
		}

	}, function(err, results) {
		if (!err) {
			res.render('vendorNav/coupons/edit-coupon', {
				title: "Global Trade Connect",
				products: results.products,
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				selectedPage:'coupons',
			});
		} else {
			res.render('vendorNav/coupons/add-coupon', err);
		}
	});
}

export function editCoupons(req, res) {

	var LoggedInUser = {};
	var bottomCategory={};
	if (req.user)
		LoggedInUser = req.user;
	let user_id = LoggedInUser.id;

	var queryObj = {};
	var includeArr = [];
	var offset, limit, field, order;

	var modelName = "Coupon";

	queryObj['id'] = req.query.id;
	queryObj['vendor_id'] = req.user.Vendor.id;
	queryObj['status'] = status["ACTIVE"];
	var coupon_id = 0;

	field = "id";
	order = "asc";

	async.series({
		coupon: function(callback) {
			service.findOneRow(modelName, queryObj, includeArr)
				.then(function(coupon) {
					if (coupon) {
						coupon_id = req.query.id;
					}
					return callback(null, coupon);
				}).catch(function(error) {
					console.log('Error:::', error);
					return callback(null);
				});
		},
		products: function(callback) {
			var productQueryObj = {};
			var productModel = "Product";

			productQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(productModel, includeArr, productQueryObj, offset, limit, field, order)
				.then(function(products) {
					return callback(null, products.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		categories: function(callback) {
			var categoryQueryObj = {};
			var categoryModel = "Category";

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, offset, limit, field, order)
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
		couponProducts: function(callback) {
			var couponProductsQueryObj = {};
			var couponProductsModel = "CouponProduct";

			couponProductsQueryObj['status'] = status["ACTIVE"];
			couponProductsQueryObj['coupon_id'] = coupon_id;

			service.findAllRows(couponProductsModel, includeArr, couponProductsQueryObj, offset, limit, field, order)
				.then(function(couponProducts) {
					var couponProductsID = [];
					if (couponProducts.rows.length > 0) {
						for (var i = 0; i < couponProducts.rows.length; i++) {
							couponProductsID.push(couponProducts.rows[i].product_id);
						}
						return callback(null, couponProductsID);
					} else {
						return callback(null, couponProductsID);
					}
				}).catch(function(error) {
					console.log('Error:::', error);
					return callback(null);
				});
		},
		couponExcludeProducts: function(callback) {
			var couponExcludeProductsQueryObj = {};
			var couponExcludeProductsModel = "CouponExcludedProduct";

			couponExcludeProductsQueryObj['status'] = status["ACTIVE"];
			couponExcludeProductsQueryObj['coupon_id'] = coupon_id;

			service.findAllRows(couponExcludeProductsModel, includeArr, couponExcludeProductsQueryObj, offset, limit, field, order)
				.then(function(couponExcludeProducts) {
					var couponExcludeProductsID = [];
					if (couponExcludeProducts.rows.length > 0) {
						for (var i = 0; i < couponExcludeProducts.rows.length; i++) {
							couponExcludeProductsID.push(couponExcludeProducts.rows[i].product_id);
						}
						return callback(null, couponExcludeProductsID);
					} else {
						return callback(null, couponExcludeProductsID);
					}
					// return callback(null, couponExcludeProducts.rows);
				}).catch(function(error) {
					console.log('Error:::', error);
					return callback(null);
				});
		},
		couponCategories: function(callback) {
			var couponCategoriesQueryObj = {};
			var couponCategoryModel = "CouponCategory";

			couponCategoriesQueryObj['status'] = status["ACTIVE"];
			couponCategoriesQueryObj['coupon_id'] = coupon_id;

			service.findAllRows(couponCategoryModel, includeArr, couponCategoriesQueryObj, offset, limit, field, order)
				.then(function(couponCategories) {
					var couponCategoriesID = [];
					if (couponCategories.rows.length > 0) {
						for (var i = 0; i < couponCategories.rows.length; i++) {
							couponCategoriesID.push(couponCategories.rows[i].category_id);
						}
						return callback(null, couponCategoriesID);
					} else {
						return callback(null, couponCategoriesID);
					}
					// return callback(null, couponCategories.rows);
				}).catch(function(error) {
					console.log('Error:::', error);
					return callback(null);
				});
		},
		couponExcludeCategories: function(callback) {
			var couponExcludeCategoriesQueryObj = {};
			var couponExcludeCategoryModel = "CouponExcludedCategory";

			couponExcludeCategoriesQueryObj['status'] = status["ACTIVE"];
			couponExcludeCategoriesQueryObj['coupon_id'] = coupon_id;

			service.findAllRows(couponExcludeCategoryModel, includeArr, couponExcludeCategoriesQueryObj, offset, limit, field, order)
				.then(function(couponExcludeCategories) {
					var couponExcludeCategoriesID = [];
					if (couponExcludeCategories.rows.length > 0) {
						for (var i = 0; i < couponExcludeCategories.rows.length; i++) {
							couponExcludeCategoriesID.push(couponExcludeCategories.rows[i].category_id);
						}
						return callback(null, couponExcludeCategoriesID);
					} else {
						return callback(null, couponExcludeCategoriesID);
					}

					// return callback(null, couponExcludeCategories.rows);
				}).catch(function(error) {
					console.log('Error:::', error);
					return callback(null);
				});
		}
	}, function(error, results) {
		if (!error) {
			// console.log('results', results);
			res.render('vendorNav/coupons/edit-coupon', {
				title: "Global Trade Connect",
				coupon: results.coupon,
				products: results.products,
				categories: results.categories,
				bottomCategory: bottomCategory,
				existingCouponProducts: results.couponProducts,
				existingCouponExcludeProducts: results.couponExcludeProducts,
				existingCouponCategories: results.couponCategories,
				existingCouponExcludeCategories: results.couponExcludeCategories,
				category: results.category,
				LoggedInUser: LoggedInUser,
				vendorPlan:vendorPlan,
				selectedPage:'coupons',
			});

		} else {
			res.render('vendorNav/coupons/edit-coupon', error);
		}
	});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}