'use strict';

const async = require('async');
const sequelize = require('sequelize');
const moment = require('moment');

const service = require('../../api/service');
const searchResultService = require('../../api/service/search-result.service');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const config = require('../../config/environment');
const durationConfig=require('../../config/duration');

export function index(req, res) {
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	console.log("fullURL", fullUrl);
	var marketplaceURl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '').trim();
	console.log("marketPlaceUrl", marketplaceURl);

	var selectedLocation = 0;
	var selectedCategory = 0;
	var selectedSubCategory = 0;
	var selectedMarketPlace = 0;
	var selectedMarketPlaceType = 0;

	var bottomCategory = {};
	var categoryModel = "Category";

	var page;
	var queryURI = {};
	var includeArr = [];
	var LoggedInUser = {};
	var queryParameters = {};
	var queryPaginationObj = {};
	var marketPlaceTypeSelected = {};

	var offset, limit, field, order, layout;
	var productEndPoint = "MarketplaceProduct";

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}

	var from = req.query.fromdate;
	var to =req.query.todate;
	var start_date;
	var end_date;
	if(req.query.fromdate)
	{
		start_date = moment(req.query.fromdate).startOf('day').format('YYYY-MM-DDTHH:mm:ss')
		console.log("Start date &&&&&&&&&&&&&&&&&&&",start_date)
	}
	if(req.query.todate)
	{
		end_date = moment(req.query.todate).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
		console.log("Start date &&&&&&&&&&&&&&&&&&&",end_date)
	}

	if (from && to) {
		queryPaginationObj.fromdate = req.query.fromdate;
		queryPaginationObj.todate = req.query.todate;
		queryParameters['created_on'] = {
			$between: [start_date, end_date]
		};
		queryURI['fromdate'] = start_date;
		queryURI['todate'] = end_date;
		delete req.query.fromdate;
		delete req.query.todate;
	}

	var durations={};
	var startDateForDuration=moment().add(0, 'd').toDate();
	var weekenddate=moment().add(-7, 'd').toDate();
	var monthEndDate= moment().add(-30, 'd').toDate();
	var monthly=moment().add(-1, 'y').toDate();
	var yearly=moment().add(-30, 'y').toDate();
	durations['startDate']=moment(startDateForDuration).format('YYYY-MM-DD');
	durations['weekenddate']=moment(weekenddate).format('YYYY-MM-DD');
	durations['monthEndDate']=moment(monthEndDate).format('YYYY-MM-DD');
	durations['monthly']=moment(monthly).format('YYYY-MM-DD');
	durations['yearly']=moment(yearly).format('YYYY-MM-DD');
	console.log(durations);

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 30;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "created_on";
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

	if (req.query.keyword) {
		queryPaginationObj.keyword = req.query.keyword;
		queryURI['keyword'] = req.query.keyword;
		queryParameters['product_name'] = {
			like: '%' + req.query.keyword + '%'
		};
	}
	if (req.query.origin) {
		queryURI['origin'] = req.query.origin;
		queryParameters['$or'] = [{
			country_name: req.query.origin
		}, {
			state_name: req.query.origin
		}, {
			city: req.query.origin
		}];
	}

	if (marketplaceURl == 'wholesale') {
		console.log("marketplaceURl", marketplaceURl);
		selectedMarketPlace = marketplace['WHOLESALE'];
		queryParameters['marketplace_id'] = marketplace['WHOLESALE'];
	} else if (marketplaceURl == 'shop') {
		selectedMarketPlace = marketplace['PUBLIC'];
		queryParameters['marketplace_id'] = marketplace['PUBLIC'];
	} else if (marketplaceURl == 'services') {
		selectedMarketPlace = marketplace['SERVICE'];
		queryParameters['marketplace_id'] = marketplace['SERVICE'];
	} else if (marketplaceURl == 'lifestyle') {
		selectedMarketPlace = marketplace['LIFESTYLE'];
		queryParameters['marketplace_id'] = marketplace['LIFESTYLE'];
	} else {
		if (req.query.marketplace) {
			selectedMarketPlace = req.query.marketplace;
			queryURI['marketplace'] = req.query.marketplace;
			queryParameters['marketplace_id'] = req.query.marketplace;
		}
	}

	if (req.query.is_featured_product) {
		queryURI['is_featured_product'] = req.query.is_featured_product;
		queryParameters['is_featured_product'] = req.query.is_featured_product;
	}
	if (req.query.location) {
		selectedLocation = req.query.location;
		queryURI['location'] = req.query.location;
		queryParameters['product_location_id'] = req.query.location;
	}
	if (req.query.category) {
		selectedCategory = req.query.category;
		queryURI['category'] = req.query.category;
		queryParameters['category_id'] = req.query.category;
	}
	if (req.query.sub_category) {
		selectedSubCategory = req.query.sub_category;
		queryURI['sub_category'] = req.query.sub_category;
		queryParameters['sub_category_id'] = req.query.sub_category;
	}

	if (req.query.marketplace_type) {
		selectedMarketPlaceType = req.query.marketplace_type;
		queryURI['marketplace_type'] = req.query.marketplace_type;
		queryParameters['marketplace_type_id'] = req.query.marketplace_type;
	}
	if (req.query.vendor_id) {
		queryURI['vendor_id'] = req.query.vendor_id;
		queryParameters['vendor_id'] = req.query.vendor_id;
	}
	if (req.query.field) {
		queryURI['field'] = req.query.field;
		queryParameters['field'] = req.query.field;
	}

	// if (marketplaceURl = 'lifestyle') {
	// 	queryParameters['created_on'] = {
	// 		'$gte': start_date,
	// 		'$lte': end_date
	// 	}
	// }
	queryParameters['status'] = status["ACTIVE"];
	//selectedMarketPlace = req.query.marketplace;
	async.series({
		cartCounts: function (callback) {
			service.cartHeader(LoggedInUser).then(function (response) {
				return callback(null, response);
			}).catch(function (error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		categories: function (callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function (category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		marketPlace: function (callback) {
			var marketPlaceModel = "Marketplace";
			service.findIdRow(marketPlaceModel, selectedMarketPlace, includeArr)
				.then(function (result) {
					return callback(null, result);
				})
				.catch(function (error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		marketPlaceTypeSelected: function (callback) {
			var queryObj = {};
			var marketPlaceTypeModel = "MarketplaceType";

			queryObj['marketplace_id'] = selectedMarketPlace;
			queryObj['id'] = selectedMarketPlaceType;
			service.findOneRow(marketPlaceTypeModel, queryObj, includeArr)
				.then(function (result) {
					return callback(null, result);
				})
				.catch(function (error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		products: function (callback) {
			//queryParameters['is_featured_product'] = 0;
            queryParameters['status'] = 1;
			service.findAllRows(productEndPoint, includeArr, queryParameters, offset, limit, field, order)
				.then(function (results) {
					return callback(null, results);
				})
				.catch(function (error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		topProducts: function (callback) {
			var topOffset = 0;
			var topLimit = 3;
			var topOrderField;
			topOrderField = req.query.field ? req.query.field : "created_on";
			var topOrderType = order;

			queryParameters['is_featured_product'] = 1;

			service.findAllRows(productEndPoint, includeArr, queryParameters, topOffset, topLimit, topOrderField, topOrderType)
				.then(function (results) {
					return callback(null, results);
				})
				.catch(function (error) {
					console.log('Error:::', error);
					return callback(error, null);
				});
		},
		countryWithCount: function (callback) {
			var result = {};
			var categoryQueryObj = {};
			var productCountQueryParames = {};

			categoryQueryObj['status'] = status["ACTIVE"];
			productCountQueryParames['status'] = status["ACTIVE"];

			// if (marketplaceURl = 'lifestyle') {
			// 	productCountQueryParames['created_on'] = {
			// 		'$gte': start_date,
			// 		'$lte': end_date
			// 	}
			// }

			if (req.query.marketplace) {
				productCountQueryParames['marketplace_id'] = req.query.marketplace;
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
			if(marketplaceURl == 'wholesale')
			{
				productCountQueryParames['marketplace_id'] = marketplace['WHOLESALE'];
			}
			else if(marketplaceURl == 'shop')
			{
				productCountQueryParames['marketplace_id'] = marketplace['PUBLIC'];
			}
			else if(marketplaceURl == 'services')
			{
				productCountQueryParames['marketplace_id'] = marketplace['SERVICE'];
			}
			else if(marketplaceURl == 'lifestyle')
			{
				productCountQueryParames['marketplace_id'] = marketplace['LIFESTYLE'];
			}
			searchResultService.countryWithProductCount(productCountQueryParames)
				.then(function (response) {
					console.log("rettiidasss::");
					return callback(null, response);


				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		categoriesWithCount: function (callback) {
			var result = {};
			var categoryQueryObj = {};
			var productCountQueryParames = {};

			categoryQueryObj['status'] = status["ACTIVE"];
			productCountQueryParames['status'] = status["ACTIVE"];

			// if (marketplaceURl = 'lifestyle') {
			// 	productCountQueryParames['created_on'] = {
			// 		'$gte': start_date,
			// 		'$lte': end_date
			// 	}
			// }

			if (req.query.marketplace) {
				productCountQueryParames['marketplace_id'] = req.query.marketplace;
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
			if(marketplaceURl == 'wholesale')
			{
				productCountQueryParames['marketplace_id'] = marketplace['WHOLESALE'];
			}
			else if(marketplaceURl == 'shop')
			{
				productCountQueryParames['marketplace_id'] = marketplace['PUBLIC'];
			}
			else if(marketplaceURl == 'services')
			{
				productCountQueryParames['marketplace_id'] = marketplace['SERVICE'];
			}
			else if(marketplaceURl == 'lifestyle')
			{
				productCountQueryParames['marketplace_id'] = marketplace['LIFESTYLE'];
			}
			searchResultService.categoryWithProductCount(productCountQueryParames)
				.then(function (response) {
					console.log("rettiidasss::");
					return callback(null, response);


				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		countMarketPlaceTypes: function (callback) {
			var result = {};
			var categoryQueryObj = {};
			var productCountQueryParames = {};

			// if (marketplaceURl = 'lifestyle') {
			// 	productCountQueryParames['created_on'] = {
			// 		'$gte': start_date,
			// 		'$lte': end_date
			// 	}
			// }

			categoryQueryObj['status'] = status["ACTIVE"];
			productCountQueryParames['status'] = status["ACTIVE"];

			if (req.query.marketplace) {
				productCountQueryParames['marketplace_id'] = req.query.marketplace;
			}
			if (req.query.marketplace_type) {
				productCountQueryParames['marketplace_type_id'] = parseInt(req.query.marketplace_type);
			}
			if (req.query.location) {
				productCountQueryParames['product_location'] = req.query.location;
			}
			if (req.query.keyword) {
				productCountQueryParames['product_name'] = {
					like: '%' + req.query.keyword + '%'
				};
			}
			if(marketplaceURl == 'wholesale')
			{
				productCountQueryParames['marketplace_id'] = marketplace['WHOLESALE'];
			}
			else if(marketplaceURl == 'shop')
			{
				productCountQueryParames['marketplace_id'] = marketplace['PUBLIC'];
			}
			else if(marketplaceURl == 'services')
			{
				productCountQueryParames['marketplace_id'] = marketplace['SERVICE'];
			}
			else if(marketplaceURl == 'lifestyle')
			{
				productCountQueryParames['marketplace_id'] = marketplace['LIFESTYLE'];
			}
			searchResultService.marketplacetypeWithProductCount(productCountQueryParames)
				.then(function (response) {
					console.log("rettiidasss::");
					return callback(null, response);


				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		countWithDuration: function (callback) {
			var result = {};
			var categoryQueryObj = {};
			var productCountQueryParames = {};

			// if (marketplaceURl = 'lifestyle') {
			// 	productCountQueryParames['created_on'] = {
			// 		'$gte': start_date,
			// 		'$lte': end_date
			// 	}
			// }

			categoryQueryObj['status'] = status["ACTIVE"];
			productCountQueryParames['status'] = status["ACTIVE"];

			if (req.query.marketplace) {
				productCountQueryParames['marketplace_id'] = req.query.marketplace;
			}
			if (req.query.marketplace_type) {
				productCountQueryParames['marketplace_type_id'] = parseInt(req.query.marketplace_type);
			}
			if (req.query.location) {
				productCountQueryParames['product_location'] = req.query.location;
			}
			if (req.query.keyword) {
				productCountQueryParames['product_name'] = {
					like: '%' + req.query.keyword + '%'
				};
			}
			if(marketplaceURl == 'wholesale')
			{
				productCountQueryParames['marketplace_id'] = marketplace['WHOLESALE'];
			}
			else if(marketplaceURl == 'shop')
			{
				productCountQueryParames['marketplace_id'] = marketplace['PUBLIC'];
			}
			else if(marketplaceURl == 'services')
			{
				productCountQueryParames['marketplace_id'] = marketplace['SERVICE'];
			}
			else if(marketplaceURl == 'lifestyle')
			{
				productCountQueryParames['marketplace_id'] = marketplace['LIFESTYLE'];
			}
			searchResultService.durationWithProductCount(productCountQueryParames)
				.then(function (response) {
					console.log("rettiidasss::");
					return callback(null, response);


				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function (error, results) {
		queryPaginationObj['maxSize'] = 5;
		console.log("******************************************",results.countWithDuration);
		if (!error) {
			res.render('search', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				LoggedInUser: LoggedInUser,
				selectedLocation: selectedLocation,
				selectedCategory: selectedCategory,
				selectedSubCategory: selectedSubCategory,
				selectedMarketPlace: results.marketPlace,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				selectedMarketPlaceType: selectedMarketPlaceType,
				marketPlaceTypeSelected: results.marketPlaceTypeSelected,
				productResults: results.products,
				topFeaturedProducts: results.topProducts,
				marketPlaceTypes: results.countMarketPlaceTypes,
				locations: results.countryWithCount,
				categoriesWithCount: results.categoriesWithCount,
				countWithDuration:results.countWithDuration,
				marketplaceURl: marketplaceURl,
				cartheader: results.cartCounts,
				durationConfig:durationConfig,
				layout_type: layout,
				durations: durations
			});
		} else {
			res.render('search', error);
		}
	});
}
function changeDateFormat(inputDate){  // expects Y-m-d
    var splitDate = inputDate.split('/');
    if(splitDate.count == 0){
        return null;
    }

    var month = splitDate[0];
    var day = splitDate[1];
	var year = splitDate[2];

    return year + '-' + month + '-' + day;
}
