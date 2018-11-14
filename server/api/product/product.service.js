'use strict';

var fs = require('fs');
var async = require("async");
var https = require('https');
const moment = require('moment');
const sequelize = require('sequelize');
const service = require('../service');
const config = require('../../config/environment');
const status = require('../../config/status');
const orderItemStatus = require('../../config/order-item-new-status');
const marketplace = require('../../config/marketplace');
const Sequelize_Instance = require('../../sqldb/index');
const RawQueries = require('../../raw-queries/sql-queries');
const roles = require('../../config/roles');
const model = require('../../sqldb/model-connect');

export async function queryAllProducts(isUserId, queryObj, offset, limit, field, order) {
	var results = {};
	var vendorAttributes = [];
	var orderCondition = [];

	if (field && order) {
		orderCondition.push([field, order]);
	} else {
		orderCondition.push(sequelize.fn('RAND'));
	}

	results['count'] = 0;
	results['rows'] = [];
	queryObj['status'] = status['ACTIVE'];

	if (isUserId) {
		vendorAttributes = ['id', 'vendor_name', 'vendor_profile_pic_url'];
	} else {
		vendorAttributes = ['vendor_profile_pic_url'];
	}

	var includeCountArray = [{
		model: model['Vendor'],
		include: [{
			model: model['VendorPlan'],
			attributes: [],
			where: {
				status: status['ACTIVE'],
				start_date: {
					'$lte': moment().format('YYYY-MM-DD')
				},
				end_date: {
					'$gte': moment().format('YYYY-MM-DD')
				}
			}
		}],
		attributes: vendorAttributes,
		where: {
			status: status['ACTIVE']
		}
	}];

	var includeArray = [{
		model: model['Vendor'],
		include: [{
			model: model['VendorPlan'],
			attributes: [],
			where: {
				status: status['ACTIVE'],
				start_date: {
					'$lte': moment().format('YYYY-MM-DD')
				},
				end_date: {
					'$gte': moment().format('YYYY-MM-DD')
				}
			}
		}],
		attributes: vendorAttributes,
		where: {
			status: status['ACTIVE']
		}
	}, {
		model: model['Marketplace'],
		attributes: ['id', 'name', 'code'],
		where: {
			status: status['ACTIVE']
		}
	}, {
		model: model['MarketplaceType'],
		attributes: ['id', 'marketplace_id', 'name', 'code'],
		required: false,
		where: {
			status: status['ACTIVE']
		}
	}, {
		model: model['Country'],
		attributes: ['id', 'name', 'code'],
		where: {
			status: status['ACTIVE']
		}
	}, {
		model: model['Category'],
		attributes: ['id', 'name', 'code', 'description'],
		where: {
			status: status['ACTIVE']
		}
	}, {
		model: model['SubCategory'],
		attributes: ['id', 'category_id', 'name', 'code'],
		where: {
			status: status['ACTIVE']
		}
	}, {
		model: model['Review'],
		attributes: [],
		where: {
			status: status['ACTIVE']
		},
		required: false
	}, {
		model: model['ProductMedia'],
		where: {
			status: status['ACTIVE'],
			base_image: 1
		},
		attributes: ['id', 'product_id', 'type', 'url', 'base_image'],
		required: false
	}];

	if (queryObj.is_featured_product == 1) {
		var featuredProductQueryObj = {
			status: status['ACTIVE'],
			feature_status: status['ACTIVE'],
			start_date: {
				'$lte': moment().format('YYYY-MM-DD')
			},
			$or: [{
				end_date: {
					'$gte': moment().format('YYYY-MM-DD')
				}
			}, {
				feature_indefinitely: 1
			}]
		};
		var position = queryObj.position;
		if (position) {
			featuredProductQueryObj[position] = status['ACTIVE'];
			delete queryObj.position;
		}
		includeArray.push({
			model: model['FeaturedProduct'],
			where: featuredProductQueryObj
		});
		includeCountArray.push({
			model: model['FeaturedProduct'],
			attributes: [],
			where: featuredProductQueryObj
		});
		delete queryObj.is_featured_product;
	}

	try {
		const productResponse = await model['Product'].findAll({
			include: includeArray,
			where: queryObj,
			subQuery: false,
			attributes: ['id', 'sku', 'product_name', 'product_slug', 'description', 'quantity_available', 'price', 'moq', 'exclusive_sale', 'exclusive_start_date', 'exclusive_end_date', 'exclusive_offer', 'status', [sequelize.literal('(SUM(Reviews.rating) / COUNT(Reviews.user_id))'), 'product_rating']],
			offset: offset,
			limit: limit,
			order: orderCondition,
			group: ['id']
		});
		const products = await JSON.parse(JSON.stringify(productResponse));
		if (products.length > 0) {
			await Promise.all(products.map(async (product) => {
				const currentDate = new Date();
				const exclusiveStartDate = new Date(product.exclusive_start_date);
				const exclusiveEndDate = new Date(product.exclusive_end_date);
				if (product.exclusive_sale && (exclusiveStartDate <= currentDate && exclusiveEndDate >= currentDate)) {
					product['discount'] = ((product.price / 100) * product.exclusive_offer).toFixed(2);
					product['product_discounted_price'] = (parseFloat(product['price']) - product['discount']).toFixed(2);
					results.rows.push(product);
				} else {
					delete product.exclusive_start_date;
					delete product.exclusive_end_date;
					delete product.exclusive_offer;
					results.rows.push(product);
				}
			}));
			const productCount = await model['Product'].count({
				include: includeCountArray,
				where: queryObj
			});
			results.count = (productCount ? productCount : 0);
		}
		return results;
	} catch (error) {
		return error;
	}
}

export function productView(productID, isUserId) {
	var vendorAttributes = [];
	if (isUserId) {
		vendorAttributes = ['id', 'vendor_name', 'vendor_profile_pic_url'];
	} else {
		vendorAttributes = ['vendor_profile_pic_url'];
	}
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
				model: model['Vendor'],
				include: [{
					model: model['VendorPlan'],
					attributes: [],
					where: {
						status: status['ACTIVE'],
						start_date: {
							'$lte': moment().format('YYYY-MM-DD')
						},
						end_date: {
							'$gte': moment().format('YYYY-MM-DD')
						}
					}
				}],
				attributes: vendorAttributes,
				where: {
					status: status['ACTIVE']
				}

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
				limit: 7,
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

export async function TopSellingProducts(offset, limit, marketplace) {
	var vendorModelName = "Vendor";
	var countryModelName = "Country";
	var productModelName = "Product";
	var categoryModelName = "Category";
	var orderItemModelName = "OrderItem";
	var vendorPlanModelName = "VendorPlan";
	var subCategoryModelName = "SubCategory";

	var includeArray = [{
		model: model[productModelName],
		attributes: ['id', 'sku', 'product_name', 'product_slug', 'status', 'marketplace_id', 'marketplace_type_id', 'price', 'exclusive_sale', 'exclusive_start_date', 'exclusive_end_date'],
		include: [{
			model: model[countryModelName],
			attributes: ['id', 'name', 'code']
		}, {
			model: model[categoryModelName],
			attributes: ['id', 'name', 'code']
		}, {
			model: model[subCategoryModelName],
			attributes: ['id', 'name', 'code']
		}, {
			model: model[vendorModelName],
			attributes: [],
			include: [{
				model: model[vendorPlanModelName],
				attributes: [],
				where: {
					status: status['ACTIVE']
				}
			}]
		}, {
			model: model['ProductMedia'],
			where: {
				status: status['ACTIVE'],
				base_image: 1
			},
			attributes: ['id', 'product_id', 'type', 'url', 'base_image'],
			required: false
		}]
	}];

	try {
		const productResponse = await model[orderItemModelName].findAll({
			where: {
				'$or': [{
					order_item_status: orderItemStatus['DELIVERED']
				}, {
					order_item_status: orderItemStatus['COMPLETED']
				}],
				'$Product.marketplace_id$': marketplace,
				'$Product->Vendor->VendorPlans.start_date$': {
					'$lte': moment().format('YYYY-MM-DD')
				},
				'$Product->Vendor->VendorPlans.end_date$': {
					'$gte': moment().format('YYYY-MM-DD')
				}
			},
			attributes: [
				'id', 'product_id', [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'sales_count']
			],
			include: includeArray,
			subQuery: false,
			offset: offset,
			limit: limit,
			order: sequelize.literal('sales_count DESC'),
			group: ['OrderItem.product_id']
		});
		const products = JSON.parse(JSON.stringify(productResponse));
		await Promise.all(products.map(async (element) => {
			const currentDate = new Date();
			const exclusiveStartDate = new Date(element.Product.exclusive_start_date);
			const exclusiveEndDate = new Date(element.Product.exclusive_end_date);
			if (element.Product.exclusive_sale && (exclusiveStartDate <= currentDate && exclusiveEndDate >= currentDate)) {
				element.Product['discount'] = ((element.Product.price / 100) * element.Product.exclusive_offer).toFixed(2);
				element.Product['product_discounted_price'] = (parseFloat(element.Product['price']) - element.Product['discount']).toFixed(2);
			} else {
				delete element.Product.exclusive_start_date;
				delete element.Product.exclusive_end_date;
				delete element.Product.exclusive_offer;
			}
		}));
		return products;
	} catch (error) {
		console.log("TopSellingProducts Error:::", error);
		return error;
	}
}

export function productRatingsCount(productID) {
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
			var responseRatings = JSON.parse(JSON.stringify(ratings));
			if (responseRatings.length > 0) {
				for (var i = 0; i < productRating.length; i++) {
					for (var j = 0; j < responseRatings.length; j++) {
						if (productRating[i].rating == responseRatings[j].rating) {
							productRating[i].userCount = responseRatings[j].userCount;
						}
					}
				}
			}
			resolve(productRating);
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

export async function vendorProducts(queryObj, offset, limit, field, order) {
	var result = {};
	var productModelName = "Product";
	var orderItemModelName = "OrderItem";
	var productMediaModelName = "ProductMedia";
	var includeArray = [{
		model: model[orderItemModelName],
		attributes: [],
		where: {
			'$or': [{
				order_item_status: orderItemStatus['DELIVERED']
			}, {
				order_item_status: orderItemStatus['COMPLETED']
			}]
		},
		required: false
	}, {
		model: model[productMediaModelName],
		where: {
			status: status['ACTIVE'],
			base_image: 1
		},
		attributes: ['id', 'product_id', 'type', 'url', 'base_image'],
		required: false
	}];

	try {
		const vendorProductResponse = await model[productModelName].findAll({
			where: queryObj,
			attributes: ['id', 'sku', 'product_name', 'product_slug', 'vendor_id', 'status', 'marketplace_id', 'marketplace_type_id', 'publish_date', 'price', [sequelize.fn('SUM', sequelize.col('OrderItems.quantity')), 'sales_count']],
			include: includeArray,
			offset: offset,
			limit: limit,
			order: [
				[field, order]
			],
			subQuery: false,
			group: ['id']
		});
		const vendorProducts = JSON.parse(JSON.stringify(vendorProductResponse));
		if (vendorProducts.length > 0) {
			const vendorProductsCount = await model[productModelName].count({
				where: queryObj
			});
			result['count'] = vendorProductsCount;
			result['rows'] = vendorProducts;
		} else {
			result['count'] = 0;
			result['rows'] = vendorProducts;
		}
		return result;
	} catch (error) {
		console.log("vendorProducts Error:::", error);
		return error;
	}
}

export function importAliExpressProducts(product, user) {
	var productQueryObj = {};
	var newProductObj = {};
	var otherCategoryId = 39;
	var otherSubCategoryId = 730;
	productQueryObj['sku'] = product.productId;
	productQueryObj['status'] = status['ACTIVE'];

	if (user.role === roles['VENDOR']) {
		productQueryObj['vendor_id'] = user.Vendor.id
	}

	return new Promise((resolve, reject) => {
		service.findOneRow('Product', productQueryObj, [])
			.then((existingProduct) => {
				if (!existingProduct) {
					newProductObj['sku'] = product.productId;
					newProductObj['product_name'] = product.productTitle;
					newProductObj['product_slug'] = string_to_slug(product.productTitle);
					newProductObj['vendor_id'] = user.Vendor.id;
					newProductObj['status'] = status['ACTIVE'];
					newProductObj['marketplace_id'] = marketplace['PUBLIC'];
					newProductObj['publish_date'] = new Date();
					newProductObj['product_category_id'] = otherCategoryId;
					newProductObj['quantity_available'] = 0;
					newProductObj['sub_category_id'] = otherSubCategoryId;
					newProductObj['price'] = product.variations[0].pricing;
					newProductObj['product_location'] = user.Vendor.Country.id;
					newProductObj['city'] = user.Vendor.city;
					newProductObj['city_id'] = user.Vendor.city_id;
					newProductObj['created_on'] = new Date();

					return service.createRow('Product', newProductObj);
				} else {
					return Promise.reject(true);
				}
			}).then(async (newProduct) => {
				var productMedias = [];
				for (let i = 0; i < product.pics.length; i++) {
					var productMediaObj = {};
					if (i == 0) {
						productMediaObj['product_id'] = newProduct.id;
						productMediaObj['type'] = 1;
						productMediaObj['status'] = status['ACTIVE'];

						const timeInMilliSeconds = new Date().getTime();
						const filename = timeInMilliSeconds + "-" + product.pics[i].substring(product.pics[i].lastIndexOf('/') + 1);
						const url = await download(product.pics[i], filename);

						productMediaObj['url'] = config.imageUrlRewritePath.base + "products/" + url;
						productMediaObj['base_image'] = 1;
						productMediaObj['created_on'] = new Date();
						productMediaObj['created_by'] = user.first_name;
					} else {
						productMediaObj['product_id'] = newProduct.id;
						productMediaObj['type'] = 1;
						productMediaObj['status'] = status['ACTIVE'];

						const timeInMilliSeconds = new Date().getTime();
						const filename = timeInMilliSeconds + "-" + product.pics[i].substring(product.pics[i].lastIndexOf('/') + 1);
						const url = await download(product.pics[i], filename);

						productMediaObj['url'] = config.imageUrlRewritePath.base + "products/" + url;
						productMediaObj['base_image'] = 0;
						productMediaObj['created_on'] = new Date();
						productMediaObj['created_by'] = user.first_name;
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

var download = function(url, filename) {
	return new Promise((resolve, reject) => {
		var destination = config.images_base_path + "/products/" + filename;
		var file = fs.createWriteStream(destination);
		var request = https.get(url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				file.close();
				return resolve(filename);
			});
		}).on('error', function(error) {
			fs.unlink(destination);
			return reject(error)
		});
	});
};

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
					var productMediaObj = {};
					if (i == 0) {
						productMediaObj['product_id'] = newProduct.id;
						productMediaObj['type'] = 1;
						productMediaObj['status'] = status['ACTIVE'];
						productMediaObj['url'] = product.images[i].src;
						productMediaObj['base_image'] = 1;
						productMediaObj['created_on'] = new Date();
						productMediaObj['created_by'] = req.user.first_name;
					} else {
						productMediaObj['product_id'] = newProduct.id;
						productMediaObj['type'] = 1;
						productMediaObj['status'] = status['ACTIVE'];
						productMediaObj['url'] = product.images[i].src;
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


export function RandomProducts(modelName, queryObj, limit, order) {
	return new Promise((resolve, reject) => {
		model[modelName].findAndCountAll({
			where: queryObj,
			limit: limit,
			order: order
		}).then(function(rows) {
			resolve(rows);
		}).catch(function(error) {
			reject(error);
		});
	});
}