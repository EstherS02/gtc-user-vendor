'use strict';

const moment = require('moment');
var _ = require('lodash');
const service = require('../service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');

export async function cartCalculation(userID, req, res) {
	var cart = {};
	var queryObj = {};
	var order = "desc";
	var couponQueryObj = {};
	const field = "created_on";
	const cartModelName = "Cart";
	const couponModelName = "Coupon";
	var promoCode = req.cookies.applied_coupon ? req.cookies.applied_coupon : null;

	var products = [];
	var appliedProducts = [];
	var appliedCategoryProducts = [];
	var couponApplicableProducts = [];
	const productModelName = "Product";

	cart['total_items'] = 0;
	cart['coupon_applied'] = false;
	cart['marketplace_summary'] = {};
	cart['marketplace_products'] = {};
	cart['grand_total'] = 0;
	cart['discount_amount'] = 0;
	cart['grand_total_with_discounted_amount'] = 0;

	const includeArray = [{
		model: model['Product'],
		attributes: ['id', 'product_name', 'product_slug', 'marketplace_id', 'marketplace_type_id', 'vendor_id', 'price', 'moq', 'exclusive_sale', 'exclusive_start_date', 'exclusive_end_date', 'exclusive_offer', 'subscription_duration', 'subscription_duration_unit'],
		include: [{
			model: model['Vendor'],
			attributes: ['id', 'vendor_name']
		}, {
			model: model['Category'],
			attributes: ['id', 'name']
		}, {
			model: model['SubCategory'],
			attributes: ['id', 'name', 'category_id']
		}, {
			model: model['Country'],
			attributes: ['id', 'name']
		}, {
			model: model["ProductMedia"],
			attributes: ['id', 'type', 'base_image', 'url'],
			where: {
				base_image: 1
			}
		}]
	}];

	queryObj['status'] = status['ACTIVE'];
	queryObj['user_id'] = userID;

	couponQueryObj['code'] = promoCode;

	try {
		const cartResonse = await service.findAllRows(cartModelName, includeArray, queryObj, 0, null, field, order);
		cart['total_items'] = cartResonse.count;

		if (cartResonse.count) {
			const cartProducts = cartResonse.rows;
			const couponIncludeArray = await [{
				model: model['CouponProduct'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}, {
				model: model['CouponCategory'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}, {
				model: model['CouponExcludedProduct'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}, {
				model: model['CouponExcludedCategory'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}];

			const coupon = await service.findOneRow(couponModelName, couponQueryObj, couponIncludeArray);
			if (coupon) {
				const currentDate = moment().format('YYYY-MM-DD');
				const expiryDate = moment(coupon.expiry_date).format('YYYY-MM-DD');

				const productResponse = await service.findAllRows(productModelName, [], {
					vendor_id: coupon.vendor_id,
					status: status['ACTIVE']
				}, 0, null, 'id', 'asc');
				products = await productResponse.rows;

				if (currentDate <= expiryDate) {
					if (coupon.CouponProducts.length == 0 && coupon.CouponExcludedProducts.length > 0) {
						var couponExcludedProducts = await _.map(coupon.CouponExcludedProducts, 'product_id');
						appliedProducts = await _.filter(products, function(excludeProduct) {
							return couponExcludedProducts.indexOf(excludeProduct.id) === -1;
						});
					} else if (coupon.CouponProducts.length > 0) {
						var couponProducts = await _.map(coupon.CouponProducts, 'product_id');
						appliedProducts = await _.filter(products, function(product) {
							return couponProducts.indexOf(product.id) > -1;
						});
					} else {
						appliedProducts = await products;
					}

					if (coupon.CouponCategories.length == 0 && coupon.CouponExcludedCategories.length > 0) {
						var couponExcludedCategoryProducts = await _.map(coupon.CouponExcludedCategories, 'category_id');
						appliedCategoryProducts = await _.filter(products, function(excludeProduct) {
							return couponExcludedCategoryProducts.indexOf(excludeProduct.product_category_id) === -1;
						});
					} else if (coupon.CouponCategories.length > 0) {
						var couponCategoryProducts = await _.map(coupon.CouponCategories, 'category_id');
						appliedCategoryProducts = await _.filter(products, function(product) {
							return couponCategoryProducts.indexOf(product.product_category_id) > -1;
						});
					} else {
						appliedCategoryProducts = await products;
					}

					var tmpProducts = await _.union(appliedProducts, appliedCategoryProducts);
					if (tmpProducts.length > 0) {
						couponApplicableProducts = await _.uniqBy(tmpProducts, 'id');
					}

					var discountProduct = {};
					var totalAmount;

					for (let product of couponApplicableProducts) {
						const cartProduct = await cartProducts.find((obj) => obj.product_id == product.id);
						if (cartProduct) {
							var currentDate = new Date();
							var exclusiveStartDate = new Date(cartProduct.Product.exclusive_start_date);
							var exclusiveEndDate = new Date(cartProduct.Product.exclusive_end_date);

							if ((coupon.excluse_sale_item && (cartProduct.Product.exclusive_sale && (exclusiveStartDate <= currentDate && exclusiveEndDate >= currentDate)))) {
								var discount = ((cartProduct.Product.price / 100) * cartProduct.Product.exclusive_offer).toFixed(2);
								var productDiscountedPrice = (parseFloat(cartProduct.Product['price']) - discount).toFixed(2);
								totalAmount = productDiscountedPrice * cartProduct.quantity;

								if (totalAmount >= coupon.minimum_spend && totalAmount <= coupon.maximum_spend) {
									cart['coupon_applied'] = true;
									cart['coupon_id'] = coupon.id;
									cart['coupon_code'] = coupon.code;
									cart['discount_type'] = coupon.discount_type;
									cart['discount_value'] = coupon.discount_value;
									discountProduct = cartProduct;
									cartProduct['is_coupon_applied'] = true;
									break;
								}
							} else if ((!coupon.excluse_sale_item && (cartProduct.Product.exclusive_sale || !cartProduct.Product.exclusive_sale) && (!exclusiveEndDate || exclusiveEndDate < currentDate))) {
								totalAmount = cartProduct.Product.price * cartProduct.quantity;
								if (totalAmount >= coupon.minimum_spend && totalAmount <= coupon.maximum_spend) {
									cart['coupon_applied'] = true;
									cart['coupon_id'] = coupon.id;
									cart['coupon_code'] = coupon.code;
									cart['discount_type'] = coupon.discount_type;
									cart['discount_value'] = coupon.discount_value;
									discountProduct = cartProduct;
									cartProduct['is_coupon_applied'] = true;
									break;
								}
							} else {
								continue;
							}
						}
					}
				}
			}

			const marketplaceResponse = await model['Marketplace'].findAll({
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'name', 'code', 'status']
			});
			const marketplace = JSON.parse(JSON.stringify(marketplaceResponse));

			await Promise.all(cartProducts.map((aCart) => {
				const currentDate = new Date();
				const exclusiveStartDate = new Date(aCart.Product.exclusive_start_date);
				const exclusiveEndDate = new Date(aCart.Product.exclusive_end_date);

				if (aCart.Product.exclusive_sale && (exclusiveStartDate <= currentDate && exclusiveEndDate >= currentDate)) {
					const discount = ((aCart.Product.price / 100) * aCart.Product.exclusive_offer).toFixed(2);
					aCart.Product['is_exclusive_sale'] = true;
					aCart.Product['discount'] = parseFloat(discount).toFixed(2);
					aCart.Product['product_discounted_price'] = (parseFloat(aCart.Product['price']) - parseFloat(discount)).toFixed(2);
					aCart['total_price'] = aCart.Product['product_discounted_price'] * aCart.quantity;
				} else {
					aCart['total_price'] = aCart.Product.price * aCart.quantity;
				}

				const index = marketplace.findIndex((obj) => obj.id == aCart.Product.marketplace_id);
				const existsMarketplace = cart['marketplace_products'].hasOwnProperty(marketplace[index].id);
				if (!existsMarketplace) {
					cart['marketplace_summary'][marketplace[index].id] = {};
					cart['marketplace_products'][marketplace[index].id] = {};

					cart['marketplace_summary'][marketplace[index].id].sub_total = 0;
					cart['marketplace_summary'][marketplace[index].id].shipping_ground = 0;
					cart['marketplace_summary'][marketplace[index].id].total = 0;

					cart['marketplace_products'][marketplace[index].id].count = 0;
					cart['marketplace_products'][marketplace[index].id].products = [];
				}

				cart['marketplace_summary'][aCart.Product.marketplace_id].sub_total += aCart.total_price;
				cart['marketplace_summary'][aCart.Product.marketplace_id].total = cart['marketplace_summary'][aCart.Product.marketplace_id].sub_total + cart['marketplace_summary'][aCart.Product.marketplace_id].shipping_ground;

				cart['marketplace_products'][aCart.Product.marketplace_id].count += 1;
				cart['marketplace_products'][aCart.Product.marketplace_id].products.push(aCart);
			}));

			if (cart['coupon_applied'] && (discountProduct && cart['discount_amount'] == 0)) {
				if (coupon.discount_type == 1) {
					cart['discount_amount'] = ((totalAmount / 100) * coupon.discount_value).toFixed(2);
				} else if (coupon.discount_type == 2 && parseFloat(totalAmount).toFixed(2) >= parseFloat(coupon.discount_value).toFixed(2)) {
					cart['discount_amount'] = parseFloat(coupon.discount_value).toFixed(2);
				}
			}

			await Promise.all(Object.keys(cart['marketplace_summary']).map(async (key) => {
				if (cart['marketplace_summary'].hasOwnProperty(key)) {
					cart['grand_total'] += cart['marketplace_summary'][key].total;
				}
			}));
			cart['grand_total_with_discounted_amount'] = (cart['grand_total'] - cart['discount_amount']).toFixed(2);
		}
		return cart;
	} catch (error) {
		console.log("index Error :::", error);
		return error;
	}
}