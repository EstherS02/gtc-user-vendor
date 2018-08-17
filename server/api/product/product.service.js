'use strict';

var async = require("async");
const sequelize = require('sequelize');
const service = require('../service');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const Sequelize_Instance = require('../../sqldb/index');
const RawQueries = require('../../raw-queries/sql-queries');
const roles = require('../../config/roles');
const model = require('../../sqldb/model-connect');

export function productView(productID) {
	return new Promise((resolve, reject) => {
		model['Product'].findOne({
			where: {
				id: productID,
				status: status['ACTIVE']
			},
			include: [{
				model: model['Country'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'name', 'code', 'status']
			}, {
				model: model['Marketplace'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'name', 'code', 'description', 'status']
			}, {
				model: model['MarketplaceType'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'name', 'code', 'status'],
				required: false
			}, {
				model: model['Category'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'name', 'code', 'description', 'status']
			}, {
				model: model['SubCategory'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'name', 'code', 'status']
			}, {
				model: model['ProductMedia'],
				where: {
					status: status['ACTIVE']
				},
				limit: 4,
				offset: 0,
				attributes: ['id', 'product_id', 'type', 'url', 'base_image', 'status'],
				required: false
			}, {
				model: model['Review'],
				where: {
					status: status['ACTIVE']
				},
				attributes: [
					[sequelize.fn('AVG', sequelize.col('Reviews.rating')), 'productRating']
				],
				group: ['Reviews.user_id'],
				required: false
			}]
		}).then((product) => {
			if (product) {
				resolve(product.toJSON());
			} else {
				resolve(null);
			}
		}).catch((error) => {
			reject(error);
		});
	});
}

export function productRatingsCount(productID) {
	var productRating = [];

	return new Promise((resolve, reject) => {
		model['Review'].findAll({
			where: {
				product_id: productID,
				status: status['ACTIVE']
			},
			attributes: [
				'rating', [sequelize.fn('COUNT', sequelize.col('Review.user_id')), 'userCount']
			],
			group: ['Review.rating']
		}).then((ratings) => {
			// if (ratings.length > 0) {
			// 	ratings = JSON.parse(JSON.stringify(ratings));
			// 	for (var i = 0; i < 7; i++) {
			// 		if (ratings[i] && ((i + 1) == ratings[i].rating)) {
			// 			productRating.push({
			// 				"rating": ratings[i].rating,
			// 				"userCount": ratings[i].userCount
			// 			});
			// 		} else {
			// 			productRating.push({
			// 				"rating": i + 1,
			// 				"userCount": 0
			// 			});
			// 		}
			// 	}
			// 	resolve(productRating);
			// } else {
			// 	productRating = [{
			// 		"rating": 1,
			// 		"userCount": 0
			// 	}, {
			// 		"rating": 2,
			// 		"userCount": 0
			// 	}, {
			// 		"rating": 3,
			// 		"userCount": 0
			// 	}, {
			// 		"rating": 4,
			// 		"userCount": 0
			// 	}, {
			// 		"rating": 5,
			// 		"userCount": 0
			// 	}, {
			// 		"rating": 6,
			// 		"userCount": 0
			// 	}, {
			// 		"rating": 7,
			// 		"userCount": 0
			// 	}];
			// 	resolve(productRating);
			// }
			var productRating = [{
				rating:7,
				userCount:0
			},,{
				rating:6,
				userCount:0
			},{
                rating: 5,
                userCount: 0
            }, {
                rating: 4,
                userCount: 0
            }, {
                rating: 3,
                userCount: 0
            }, {
                rating: 2,
                userCount: 0
            }, {
                rating: 1,
                userCount: 0
            }];
	            if (ratings.length > 0) {
            	    for (let key in ratings) {
                	if (ratings[key].rating <= 7)
                    	productRating[7 - ratings[key].rating].userCount = productRating[7 - ratings[key].rating].userCount + 1;
            		}
            	resolve(productRating);
            	}

            var total = 0;
            var rating = results.AllReviews.rows;
		}).catch((error) => {
			reject(error);
		});
	});
}

export function productReviews(queryObj, offset, limit, field, order) {
	var result = {};
	return new Promise((resolve, reject) => {
		model['Review'].findAll({
			where: queryObj,
			include: [{
				model: model['User'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'first_name', 'user_pic_url', 'status']
			}],
			order: [
				[field, order]
			],
			offset: offset,
			limit: limit,
			attributes: ['id', 'product_id', 'user_id', 'rating', 'title', 'comment', 'status', 'created_on'],
			required: false
		}).then((productReviews) => {
			var convertRowsJSON = [];
			if (productReviews.length > 0) {
				convertRowsJSON = JSON.parse(JSON.stringify(productReviews));
				model['Review'].count({
					where: queryObj
				}).then(function(count) {
					result.count = count;
					result.rows = convertRowsJSON;
					resolve(result);
				}).catch(function(error) {
					reject(error);
				});
			} else {
				result.count = 0;
				result.rows = convertRowsJSON;
				resolve(result);
			}

		}).catch((error) => {
			reject(error);
		});
	});
}

export function importAliExpressProducts(product, req) {
	var productQueryObj = {};
	var newProductObj = {};
	var otherCategoryId = 39;
	var otherSubCategoryId = 730;
	productQueryObj['sku'] = product.productId;
	productQueryObj['status'] = status['ACTIVE'];

	if (req.user.role === roles['VENDOR']) {
		productQueryObj['vendor_id'] = req.user.Vendor.id
	}

	return new Promise((resolve, reject) => {
		service.findOneRow('Product', productQueryObj, [])
			.then((existingProduct) => {
				if (!existingProduct) {
					newProductObj['sku'] = product.productId;
					newProductObj['product_name'] = product.productTitle;
					newProductObj['product_slug'] = string_to_slug(product.productTitle);
					newProductObj['vendor_id'] = req.user.Vendor.id;
					newProductObj['status'] = status['ACTIVE'];
					newProductObj['marketplace_id'] = marketplace['PUBLIC'];
					newProductObj['publish_date'] = new Date();
					newProductObj['product_category_id'] = otherCategoryId;
					newProductObj['quantity_available'] = 0;
					newProductObj['sub_category_id'] = otherSubCategoryId;
					newProductObj['price'] = product.variations[0].pricing;
					//newProductObj['description'] = product.description;
					newProductObj['product_location'] = req.user.Vendor.Country.id;
					newProductObj['city'] = req.user.Vendor.city;
					newProductObj['city_id'] = req.user.Vendor.city_id;
					newProductObj['created_on'] = new Date();

					return service.createRow('Product', newProductObj);
				} else {
					return Promise.reject(true);
				}
			}).then((newProduct) => {
				var productMedias = [];
				for (let i = 0; i < product.pics.length; i++) {
					var productMediaObj = {};
					if (i == 0) {
						productMediaObj['product_id'] = newProduct.id;
						productMediaObj['type'] = 1;
						productMediaObj['status'] = status['ACTIVE'];
						productMediaObj['url'] = product.pics[i];
						productMediaObj['base_image'] = 1;
						productMediaObj['created_on'] = new Date();
						productMediaObj['created_by'] = req.user.first_name;
					} else {
						productMediaObj['product_id'] = newProduct.id;
						productMediaObj['type'] = 1;
						productMediaObj['status'] = status['ACTIVE'];
						productMediaObj['url'] = product.pics[i];
						productMediaObj['base_image'] = 0;
						productMediaObj['created_on'] = new Date();
						productMediaObj['created_by'] = req.user.first_name;
					}
					productMedias.push(service.createRow('ProductMedia', productMediaObj));
				}
				return Promise.all(productMedias);
			}).then((result) => {
				resolve("success");
			}).catch(function(error) {
				reject(error);
			});
	});
}

export function importWooCommerceProducts(product, req) {

	var productQueryObj = {};
	var newProductObj = {};
	var category_id;
	var otherSubCategoryId = 730;
	productQueryObj['sku'] = product.sku;
	productQueryObj['status'] = status['ACTIVE'];

	if (req.user.role === roles['VENDOR']) {
		productQueryObj['vendor_id'] = req.user.Vendor.id
	}

	return new Promise((resolve, reject) => {
		return service.findOneRow('Product', productQueryObj, [])
			.then((existingProduct) => {
				if (!existingProduct) {
					return service.findOneRow('Category', {
						name: product.categories[0].name,
						status: status['ACTIVE']
					}, []);
				} else {
					return Promise.reject(true);
				}
			}).then((existingCategory) => {
				if (!existingCategory) {
					return service.findOneRow('Category', {
						name: "OTHERS",
						status: status['ACTIVE']
					}, []);
				} else {
					category_id = existingCategory.id;
				}
			}).then((othersCategory) => {
				if (othersCategory) {
					category_id = othersCategory.id;
					newProductObj['sku'] = product.sku;
					newProductObj['product_name'] = product.name;
					newProductObj['product_slug'] = product.slug;
					newProductObj['vendor_id'] = req.user.Vendor.id;
					newProductObj['status'] = status['ACTIVE'];
					newProductObj['marketplace_id'] = marketplace['PUBLIC'];
					newProductObj['publish_date'] = new Date();
					newProductObj['product_category_id'] = category_id;
					newProductObj['quantity_available'] = 0;
					newProductObj['sub_category_id'] = otherSubCategoryId;
					newProductObj['price'] = product.price;
					newProductObj['description'] = product.description;
					newProductObj['product_location'] = req.user.Vendor.Country.id;
					newProductObj['created_on'] = new Date();
					return service.createRow('Product', newProductObj);
				} else {

				}
			}).then((newProduct) => {
				var productMedias = [];
				for (let i = 0; i < product.images.length; i++) {
					var productMediaObj = {
						product_id: newProduct.id,
						type: 1,
						status: status['ACTIVE'],
						url: product.images[i].src,
						base_image: 1,
						created_on: new Date(),
						created_by: req.user.first_name
					}
					productMedias.push(service.createRow('ProductMedia', productMediaObj));
				}
				return Promise.all(productMedias);
			}).then((result) => {
				resolve("success");
			}).catch(function(error) {
				reject(error);
			});
	});
}

export function compareProducts(params) {
	return new Promise((resolve, reject) => {
		if (params) {
			Sequelize_Instance.query(RawQueries.compareProductQuery(params), {
				model: model['product'],
				type: Sequelize_Instance.QueryTypes.SELECT
			}).then((results) => {
				resolve(results)
			}).catch(function(error) {
				reject(error);
			});
		} else {
			resolve()
		}
	});
}

function string_to_slug(str) {
	str = str.replace(/^\s+|\s+$/g, ''); // trim
	str = str.toLowerCase();

	// remove accents, swap ñ for n, etc
	var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
	var to = "aaaaeeeeiiiioooouuuunc------";
	for (var i = 0, l = from.length; i < l; i++) {
		str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
	}

	str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
		.replace(/\s+/g, '-') // collapse whitespace and replace by -
		.replace(/-+/g, '-'); // collapse dashes

	return str;
}