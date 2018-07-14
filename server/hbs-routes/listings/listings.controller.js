'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const populate = require('../../utilities/populate');
const vendorPlan = require('../../config/gtc-plan');
var url = require('url');


export function listings(req, res) {

	var offset, limit, field, order, page, type;
	var queryParams = {}, LoggedInUser = {};
	var productModel = "MarketplaceProduct";
	field = "id";
	order = "asc";
	offset = 0;

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : config.paginationLimit;
	delete req.query.limit;

	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;

	if (req.user)
		LoggedInUser = req.user;

	queryParams['vendor_id'] = LoggedInUser.Vendor.id;

	type = req.params.type;


	if (req.params.type == 'wholesale') {
		queryParams["marketplace_id"] = 1;
		type = 'wholesale';
	}

	if (req.params.type == 'shop') {
		queryParams["marketplace_id"] = 2;
	}

	if (req.params.type == 'services') {
		queryParams["marketplace_id"] = 3;
	}

	if (req.params.type == 'lifestyle') {
		queryParams["marketplace_id"] = 4;
	}

	if (req.query.keyword) {
		queryParams['product_name'] = {
			like: '%' + req.query.keyword + '%'
		};
	}

	if (req.query.status) {
		if (req.query.status == 'ACTIVE')
			queryParams['status'] = status[req.query.status];
		if (req.query.status == 'INACTIVE')
			queryParams['status'] = status[req.query.status];
		if (req.query.status == 'SUSPENDED')
			queryParams['status'] = status[req.query.status];
		if (req.query.status == 'SOLDOUT')
			queryParams['status'] = status[req.query.status];
	}
	else {
		queryParams['status'] = {
			'$ne': status["DELETED"]
		}
	}
	console.log(queryParams)
	async.series({
		products: function (callback) {

			service.findRows(productModel, queryParams, offset, limit, field, order)
				.then(function (products) {
					return callback(null, products);

				}).catch(function (error) {
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
	}, function (err, results) {
		// console.log(results.products.rows)
		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url,'').replace(req.protocol + '://' + req.get('host'),'').replace('/','').trim();

		if (!err) {
			res.render('view-listings', {
				title: "Global Trade Connect",
				products: results.products.rows,
				collectionSize: results.products.count,
				category:results.category,
				page: page,
				pageSize: limit,
				offset: offset,
				maxSize: 5,
				statusCode: status,
				LoggedInUser: LoggedInUser,
				type: type,
				selectedPage: type,
				vendorPlan:vendorPlan,
				dropDownUrl:dropDownUrl
			});
		}
		else {
			res.render('view-listings', err);
		}
	});
}

export function editListings(req, res) {

	let searchObj = {},LoggedInUser = {},queryObj = {},type;
	var productModel = "Product";
	var categoryModel = "Category";
	var subCategoryModel = "SubCategory";
	var marketplaceTypeModel = "MarketplaceType";
	var featureModel = "MarketplaceProduct";
	var productIncludeArr = [];

	var offset, limit, field, order;
	offset = 0;
    limit = null;
    field = "id";
    order = "asc";

	productIncludeArr = populate.populateData('Marketplace,ProductMedia,Category,SubCategory,MarketplaceType');

	type = req.params.type;

	if (req.user)
		LoggedInUser = req.user;

	if (req.params.product_slug)
		searchObj["product_slug"] = req.params.product_slug;

	async.series({
		product: function (callback) {

			service.findOneRow(productModel, searchObj, productIncludeArr)
				.then(function (product) {
					return callback(null, product);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		category: function (callback) {

			service.findRows(categoryModel, queryObj, offset, limit, field, order)
				.then(function (category) {
					return callback(null, category.rows);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		subCategory: function (callback) {

			service.findRows(subCategoryModel, queryObj, offset, limit, field, order)
				.then(function (subCategory) {
					return callback(null, subCategory.rows);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		marketplaceType: function (callback) {
            service.findRows(marketplaceTypeModel, queryObj, offset, limit, field, order)
                .then(function (marketplaceType) {
                    return callback(null, marketplaceType.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
		},
		feature: function(callback){
            service.findOneRow(featureModel, searchObj)
			.then(function (feature) {
				return callback(null, feature);

			}).catch(function (error) {
				console.log('Error :::', error);
				return callback(null);
			});
		}
	}, function (err, results) {
		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url,'').replace(req.protocol + '://' + req.get('host'),'').replace('/','');
		if (!err) {
			res.render('edit-listing', {
				title: "Global Trade Connect",
				statusCode: status,
				product: results.product,
				category: results.category,
				subCategory: results.subCategory,
				LoggedInUser: LoggedInUser,
				marketplaceType:results.marketplaceType,
				type: type,
				vendorPlan:vendorPlan,
				feature:results.feature,
				dropDownUrl:dropDownUrl
			});
		}
		else {
			res.render('edit-listing', err);
		}
	});
}

export function addProduct(req, res) {

    var categoryModel = "Category";
    var countryModel = "Country";
    var marketplaceTypeModel = "MarketplaceType";

    var offset, limit, field, order;
    var queryObj = {},  LoggedInUser = {};

    var type=req.params.type;

    offset = 0;
    limit = null;
    field = "id";
    order = "asc";

    var LoggedInUser = {};

    if(req.user)
    LoggedInUser = req.user;
    

    queryObj['status'] = status["ACTIVE"];

    async.series({
        category: function (callback) {
            service.findRows(categoryModel, queryObj, offset, limit, field, order)
                .then(function (category) {
                    return callback(null, category.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        country: function (callback) {
            service.findRows(countryModel, queryObj, offset, limit, field, order)
                .then(function (country) {
                    return callback(null, country.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        marketplaceType: function (callback) {
            service.findRows(marketplaceTypeModel, queryObj, offset, limit, field, order)
                .then(function (marketplaceType) {
                    return callback(null, marketplaceType.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }
    }, function (err, results) {
		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url,'').replace(req.protocol + '://' + req.get('host'),'').replace('/','');
        if (!err) {
            res.render('add-product', {
                title: "Global Trade Connect",
                category: results.category,
                country: results.country,
                marketplaceType:results.marketplaceType,
                LoggedInUser: LoggedInUser,
                vendorPlan:vendorPlan,
				type:type,
				dropDownUrl:dropDownUrl,
            });
        }
        else {
            res.render('add-product', err);
        }
    });
}


