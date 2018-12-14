'use strict';

const async = require('async');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const marketplaceCode = require('../../../config/marketplace');
const marketplaceTypeCode = require('../../../config/marketplace_type');
const populate = require('../../../utilities/populate');
const vendorPlan = require('../../../config/gtc-plan');
const cartService = require('../../../api/cart/cart.service');
const marketplace = require('../../../config/marketplace');
var url = require('url');
const notifictionService = require('../../../api/notification/notification.service');

export function addProduct(req, res) {

	var editProductId;
	var queryObj = {}, LoggedInUser = {}, bottomCategory = {}, cardQueryObj, productIncludeArr = [];

	var offset, limit, field, order, type;

	type = req.params.type;

	offset = 0;
	limit = null;
	field = "id";
	order = "asc";

	LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	if (req.params.id)
		editProductId = req.params.id;

	queryObj['status'] = statusCode["ACTIVE"];

	cardQueryObj = {
		status : statusCode["ACTIVE"],
		user_id : LoggedInUser.id
	}

	productIncludeArr = populate.populateData('Marketplace,ProductMedia,Category,SubCategory,MarketplaceType,Discount,ProductAttribute,Category.CategoryAttribute,Category.CategoryAttribute.Attribute,Country,State,ProductAttribute.Attribute,Discount');

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
			var categoryOffset, categoryLimit, categoryField, categoryOrder;
			var categoryQueryObj = {};

			categoryOffset = 0;
			categoryLimit = null;
			categoryField = "id";
			categoryOrder = "asc";
			
			categoryQueryObj['status'] = statusCode["ACTIVE"];

			service.findAllRows('Category', includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
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
		country: function(callback) {
			service.findRows('Country', queryObj, offset, limit, 'name', order)
				.then(function(country) {
					return callback(null, country.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		marketplaceType: function(callback) {
			service.findRows('MarketplaceType', queryObj, offset, limit, field, order)
				.then(function(marketplaceType) {
					return callback(null, marketplaceType.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		editProduct: function(callback) {
			service.findIdRow('Product', editProductId, productIncludeArr)
				.then(function(editProduct) {
					return callback(null, editProduct);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		cardDetails: function(callback){
			
			service.findAllRows('PaymentSetting', [], cardQueryObj, offset, limit, field, order)
				.then(function(paymentSetting) {

					return callback(null, paymentSetting.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		unreadCounts: function(callback) {
			notifictionService.notificationCounts(LoggedInUser.id)
				.then(function(counts) {
					return callback(null, counts);
				}).catch(function(error) {
					return callback(null);
				});
		}
	}, function(err, results) {
		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');

		let productImages = [],
			productBaseImage = [];

		if (results.editProduct) {
			for (let i = 0; i < results.editProduct.ProductMedia.length; i++) {
				if (results.editProduct.ProductMedia[i].base_image != 1) {
					productImages.push({
						uploadedImage: results.editProduct.ProductMedia[i].url,
						id: results.editProduct.ProductMedia[i].id
					})
				} else if (results.editProduct.ProductMedia[i].base_image == 1) {
					productBaseImage.push({
						uploadedBaseImage: results.editProduct.ProductMedia[i].url,
						id: results.editProduct.ProductMedia[i].id
					})
				}
			}
		}

		if (!err) {
			res.render('vendorNav/listings/add-product', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				country: results.country,
				marketplaceType: results.marketplaceType,
				unreadCounts: results.unreadCounts,
				marketplaceTypeCode: marketplaceTypeCode,
				marketplaceCode: marketplaceCode,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				marketPlace: marketplace,
				vendorPlan: vendorPlan,
				type: type,
				cardDetails : results.cardDetails,
				dropDownUrl: dropDownUrl,
				editProduct: results.editProduct,
				productImages: productImages,
				productBaseImage: productBaseImage,
				statusCode: statusCode
			});
		} else {
			res.render('vendorNav/listings/add-product', err);
		}
	});
}