'use strict';

const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace.js');
const marketplaceType = require('../../config/marketplace_type.js');
const discount = require('../../config/discount');
const _ = require('lodash');
const moment = require('moment');

export async function addToCart(req, res) {
	var LoggedInUser = {};
	if (req.user) {
		LoggedInUser = req.user;
	}

	req.checkBody('product_quantity', 'Missing Query Param').notEmpty().isInt({
		gt: 0
	});

	var errors = req.validationErrors();
	if (errors) {
		return res.status(400).json({
			message: "NO_QUANTITY",
			message_details: "Please specify the number of Quantity required"
		});
	}

	const productID = req.params.id;
	const orderQuantity = req.body.product_quantity;
	const userID = LoggedInUser.id;

	try {
		const productResponse = await model["Product"].findOne({
			where: {
				id: productID,
				status: status['ACTIVE']
			},
			include: [{
				model: model['Vendor'],
				attributes: ['id', 'vendor_name'],
				include: [{
					model: model['User'],
					attributes: ['id', 'first_name', 'last_name']
				}]
			}]
		});
		if (productResponse) {
			const product = productResponse.toJSON();
			if (product.marketplace_id == 1) {
				const UserPlan = await model["UserPlan"].findOne({
					where: {
						user_id: LoggedInUser.id,
						status: status['ACTIVE'],
						start_date: {
							'$lte': moment().format('YYYY-MM-DD')
						},
						end_date: {
							'$gte': moment().format('YYYY-MM-DD')
						}
					}
				});
				if (UserPlan) {
					if (product.marketplace_type_id != marketplaceType['WTS']) {
						return res.status(200).json({
							message: "REDIRECT",
							message_details: "OOPS ! Contact Vendor to purchase this Product"
						});
					}
				} else {
					return res.status(200).json({
						message: "UPGRADEPLAN",
						message_details: "OOPS ! Please Upgrade your Plan"
					});
				}
			}
			if (product.marketplace_id == 4) {
				const subscription = await checkAlreadySubscribetion(product.id, LoggedInUser);
				if (subscription) {
					return res.status(200).json({
						message: "Subscribed",
						message_details: "OOPS ! This product Already Subscribed"
					});
				}
			}
			if (product.quantity_available == 0) {
				return res.status(400).json({
					message: "SOLD_OUT",
					message_details: "OOPS ! This product sold out, seller has no more left"
				});
			} else if (product.marketplace_id == marketplace['WHOLESALE'] && product.marketplace_type_id == marketplaceType['WTS']) {
				if (orderQuantity < product.moq) {
					return res.status(400).json({
						message: "MINIMUM_QUANTITY",
						message_details: "Minimum order quantity " + product.moq + " Items of this product",
						available_state: product.quantity_available
					});
				} else if (orderQuantity > product.quantity_available) {
					return res.status(400).json({
						message: "EXCEEDING_AVAILABLITY",
						message_details: "This seller have only " + product.quantity_available + " Items of this product",
						available_state: product.quantity_available
					});
				} else {
					const cartResponse = await addToCartAction(product, orderQuantity, LoggedInUser);
					return res.status(cartResponse.status).json(cartResponse.json);
				}
			} else if (orderQuantity > product.quantity_available) {
				return res.status(400).json({
					message: "EXCEEDING_AVAILABLITY",
					message_details: "This seller have only " + product.quantity_available + " Items of this product",
					available_state: product.quantity_available
				});
			} else {
				const cartResponse = await addToCartAction(product, orderQuantity, LoggedInUser);
				return res.status(cartResponse.status).json(cartResponse.json);
			}
		} else {
			return res.status(404).json({
				message: "NOT_FOUND",
				message_details: "Product not found"
			});
		}
	} catch (error) {
		console.log("Add To Cart Error:::", error);
		return res.status(500).send(error);
	}
}

function addToCartAction(product, orderQuantity, LoggedInUser, updateExistingCart) {
	var queryObj = {}
	var sendResponse = {};
	const userID = LoggedInUser.id;

	queryObj['user_id'] = userID;
	queryObj['product_id'] = product.id;
	queryObj['status'] = status["ACTIVE"];

	return new Promise(function(resolve, reject) {
		model["Cart"].findOne({
			where: queryObj
		}).then((cartResponse) => {
			if (cartResponse) {
				const cart = cartResponse.toJSON();

				var checkCartUpdateQuantity = parseInt(product.quantity_available) - parseInt(cart.quantity);

				if ((parseInt(orderQuantity) > parseInt(checkCartUpdateQuantity)) && !updateExistingCart) {
					var responseMessage;

					if (parseInt(checkCartUpdateQuantity) == 0) {
						responseMessage = "Already you have " + cart.quantity + " Quantities of this Product in your cart, This seller has no remaining product";
					} else {
						responseMessage = "Already you have " + cart.quantity + " Quantities of this Product in your cart, This seller only have " + checkCartUpdateQuantity + " Remaining";
					}
					sendResponse['status'] = 400;
					sendResponse['json'] = {
						message: "EXCEEDING_AVAILABLITY",
						message_details: responseMessage,
						available_state: checkCartUpdateQuantity
					}
					return resolve(sendResponse);
				} else {
					var cartUpdateObj = {};
					if (updateExistingCart)
						cartUpdateObj['quantity'] = parseInt(orderQuantity);
					else
						cartUpdateObj['quantity'] = parseInt(cart.quantity) + parseInt(orderQuantity);

					cartUpdateObj['last_updated_by'] = LoggedInUser.first_name + " " + LoggedInUser.last_name;
					cartUpdateObj['last_updated_on'] = new Date();
					cartUpdateObj['status'] = status["ACTIVE"];

					return model["Cart"].update(cartUpdateObj, {
						where: {
							id: cart.id,
							status: status["ACTIVE"]
						}
					}).then(function(updatedCartResult) {
						if (updatedCartResult) {
							sendResponse['status'] = 200;
							sendResponse['json'] = {
								message: "SUCCESS",
								message_details: "Product already in cart, Product quantity updated to " + cartUpdateObj['quantity']
							}
							return resolve(sendResponse);
						} else {
							sendResponse['status'] = 500;
							sendResponse['json'] = {
								message: "ERROR",
								message_details: "Internal Server Error, Unable to add to cart."
							}
							return resolve(sendResponse);
						}
					}).catch(function(error) {
						console.log('Error:::', error);
						return res.status(500).json({
							message: "ERROR",
							message_details: "Internal Server Error, Unable to add to cart."
						});
					});
				}
			} else {
				var createCartObj = {};
				createCartObj["user_id"] = userID;
				createCartObj["product_id"] = product.id;
				createCartObj["quantity"] = orderQuantity;
				createCartObj["status"] = status['ACTIVE'];
				createCartObj["created_by"] = LoggedInUser.first_name + " " + LoggedInUser.last_name;
				createCartObj["created_on"] = new Date();

				model["Cart"].create(createCartObj)
					.then((createdCartResult) => {
						if (createdCartResult) {
							sendResponse['status'] = 200;
							sendResponse['json'] = {
								message: "SUCCESS",
								message_details: "Product successfully added to cart"
							}
							return resolve(sendResponse);
						} else {
							sendResponse['status'] = 500;
							sendResponse['json'] = {
								message: "ERROR",
								message_details: "Unable to add to cart"
							}
							return resolve(sendResponse);
						}
					}).catch((error) => {
						console.log("Create New Cart Error:::", error);
						return reject(error);
					});
			}
		}).catch((error) => {
			return reject(error);
		})
	});
}

async function checkEligibleToUpdateCart(item, user) {
	return new Promise(async (resolve, reject) => {
		const productID = item.product_id;
		let orderQuantity = parseInt(item.product_quantity);
		if (orderQuantity <= 0)
			return reject(respJsonWrapper(400, 'NO_QUANTITY', 'Please specify the number of Quantity required', item.cart_item_id))
		try {
			let productResponse = await model["Product"].findOne({
				where: {
					id: productID,
					status: status['ACTIVE']
				}
			});
			if (productResponse) {
				const product = productResponse.toJSON();
				if (product.quantity_available == 0) {
					return reject(respJsonWrapper(400, 'SOLD_OUT', "OOPS ! This product sold out, seller has no more left", item.cart_item_id));
				} else if (product.marketplace_id == marketplace['WHOLESALE'] && product.marketplace_type_id == marketplaceType['WTS']) {
					if (orderQuantity < product.moq) {
						return reject(respJsonWrapper(400, 'MINIMUM_QUANTITY', "Minimum order quantity " + product.moq + " Items of this product", item.cart_item_id, product.quantity_available));
					} else if (orderQuantity > product.quantity_available) {
						return reject(respJsonWrapper(400, 'EXCEEDING_AVAILABLITY', "This seller have only " + product.quantity_available + " Items of this product", item.cart_item_id, product.quantity_available));
					} else {
						const cartResponse = await addToCartAction(product, orderQuantity, user, true);
						return addToCartActionWrapper(resolve, reject, cartResponse, item);
					}
				} else if (orderQuantity > product.quantity_available) {
					return reject(respJsonWrapper(400, 'EXCEEDING_AVAILABLITY', "This seller have only " + product.quantity_available + " Items of this product", item.cart_item_id, product.quantity_available));
				} else {
					const cartResponse = await addToCartAction(product, orderQuantity, user, true);
					return addToCartActionWrapper(resolve, reject, cartResponse, item);
				}
			} else {
				return reject(respJsonWrapper(404, 'PRODUCT_NOT_FOUND', 'Product Not Found', item.cart_item_id));
			}
		} catch (err) {
			reject(err);
		}
	});
}

function addToCartActionWrapper(resolve, reject, cartResponse, item) {
	if (parseInt(cartResponse.status) >= 400) {
		return reject(respJsonWrapper(cartResponse.status, cartResponse.json.message, cartResponse.json.message_details, item.cart_item_id));
	} else {
		return resolve(respJsonWrapper(cartResponse.status, cartResponse.json.message, cartResponse.json.message_details, item.cart_item_id));
	}
}

export async function updateCart(req, res) {
	let updateCartItems = req.body;
	let user = req.user;
	if (!Array.isArray(updateCartItems))
		return res.status(400).send(respJsonWrapper(400, 'BAD_REQUEST', 'Invalid Request type to update Items'));
	if (!(updateCartItems.length > 0))
		return res.status(400).send(respJsonWrapper(400, 'NO_ITEMS', 'No Cart Items to update in the request'));
	try {
		for (const item of updateCartItems) {
			await checkEligibleToUpdateCart(item, user);
		}
		return res.status(200).send(respJsonWrapper(200, 'UPDATED', 'Cart Updated Successfully'));
	} catch (error) {
		let defaultMsg = respJsonWrapper(500, 'INTERNAL_ERROR', 'Internal Server Error');
		return res.status(error.statusCode ? error.statusCode : defaultMsg.statusCode).send(error.message ? error : defaultMsg);
	}
}

function respJsonWrapper(statusCode, message, messageDetails, cartItemId, availableState) {
	let respObj = {
		statusCode: parseInt(statusCode),
		message: message,
		message_details: messageDetails,
		cart_item_id: cartItemId ? cartItemId : undefined,
		available_state: availableState ? availableState : undefined
	};
	return respObj;
}

export function removeCart(req, res) {
	service.destroyRow('Cart', req.params.id)
		.then(function(result) {
			return res.status(200).send(result);
		}).catch(function(error) {
			console.log('Error :::', error);
			return res.status(500).send("Internal server error");
		});
}

export async function applyCoupon(req, res) {
	var queryObj = {};
	var products = [];
	var finalProducts = [];
	var appliedProducts = [];
	var appliedCategoryProducts = [];
	const cartModelName = "Cart";
	const orderModelName = "Order";
	const orderItemModelName = "OrderItem";
	const couponModelName = "Coupon";
	const productModelName = "Product";
	const categoryModelName = "Category";

	res.clearCookie('applied_coupon');
	req.checkBody('code', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	queryObj['code'] = req.body.code;
	queryObj['status'] = status['ACTIVE'];

	try {
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

		const cartCount = await service.countRows(cartModelName, {
			user_id: req.user.id,
			status: status['ACTIVE']
		});

		if (cartCount > 0) {
			const coupon = await service.findOneRow(couponModelName, queryObj, couponIncludeArray);
			if (coupon) {
				const cartIncludeArray = await [{
					model: model['Product'],
					where: {
						vendor_id: coupon.vendor_id
					}
				}];
				const cartVendorProductResponse = await service.findAllRows(cartModelName, cartIncludeArray, {
					user_id: req.user.id,
					status: status['ACTIVE']
				}, 0, null, 'id', 'asc');

				if (cartVendorProductResponse.count > 0) {
					const vendorProductsInCart = await cartVendorProductResponse.rows;
					const currentDate = moment().format('YYYY-MM-DD');
					const expiryDate = moment(coupon.expiry_date).format('YYYY-MM-DD');

					if (currentDate <= expiryDate) {
						if (coupon.usage_limit) {
							const existingCount = await service.countRows(orderItemModelName, {
								coupon_id: coupon.id
							});
							if (existingCount > coupon.usage_limit) {
								return res.status(400).send("Promo code limit exceeded.");
							}
						}
						if (coupon.usage_limit_per_user) {

							const existingCount = await service.countRows(orderItemModelName, {
								coupon_id: coupon.id
							}, [{
								model: model['Order'],
								where: {
									user_id: req.user.id
								}
							}]);
							if (existingCount > coupon.usage_limit_per_user) {
								return res.status(400).send("You are already used this promo code.");
							}
						}

						const productResponse = await service.findAllRows(productModelName, [], {
							vendor_id: coupon.vendor_id,
							status: status['ACTIVE']
						}, 0, null, 'id', 'asc');
						products = await productResponse.rows;

						const categories = await service.findAllRows(categoryModelName, [], {
							status: status['ACTIVE']
						}, 0, null, 'id', 'asc');

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
							finalProducts = await _.uniqBy(tmpProducts, 'id');
						}

						var errorResponse = "Coupon failed to apply.";
						var appliedCouponCode;

						for (let product of finalProducts) {
							const cartProduct = await vendorProductsInCart.find((obj) => obj.product_id == product.id);

							if (cartProduct) {
								var currentDate = new Date();
								var exclusiveStartDate = new Date(cartProduct.Product.exclusive_start_date);
								var exclusiveEndDate = new Date(cartProduct.Product.exclusive_end_date);

								if ((coupon.excluse_sale_item && (cartProduct.Product.exclusive_sale && (exclusiveStartDate <= currentDate && exclusiveEndDate >= currentDate)))) {
									var discount = ((cartProduct.Product.price / 100) * cartProduct.Product.exclusive_offer).toFixed(2);
									var productDiscountedPrice = (parseFloat(cartProduct.Product['price']) - discount).toFixed(2);
									var totalAmount = productDiscountedPrice * cartProduct.quantity;
									if (totalAmount < coupon.minimum_spend) {
										errorResponse = "This promo code not applicable. Minimum spend " + coupon.minimum_spend;
										continue;
									} else if (totalAmount > coupon.maximum_spend) {
										errorResponse = "This promo code not applicable. Maximum spend " + coupon.maximum_spend;
										continue;
									} else {
										appliedCouponCode = coupon.code;
										break;
									}
								} else if ((!coupon.excluse_sale_item && (cartProduct.Product.exclusive_sale || !cartProduct.Product.exclusive_sale) && (!exclusiveEndDate || exclusiveEndDate < currentDate))) {
									var totalAmount = cartProduct.Product.price * cartProduct.quantity;
									if (totalAmount < coupon.minimum_spend) {
										errorResponse = "This promo code not applicable. Minimum spend " + coupon.minimum_spend;
										continue;
									} else if (totalAmount > coupon.maximum_spend) {
										errorResponse = "This promo code not applicable. Maximum spend " + coupon.maximum_spend;
										continue;
									} else {
										appliedCouponCode = coupon.code;
										break;
									}
								} else if((!coupon.excluse_sale_item && (cartProduct.Product.exclusive_sale || !cartProduct.Product.exclusive_sale) && (!exclusiveEndDate || exclusiveEndDate > currentDate))) {
									errorResponse = "This coupon is not applicable for this product";
									continue;
								} else {
									continue;
								}
							}
						}

						if (appliedCouponCode) {
							res.cookie("applied_coupon", coupon.code);
							return res.status(200).send("Promo code applied successfully.");
						} else {
							return res.status(400).send(errorResponse);
						}
					} else {
						return res.status(400).send("Promo code expired.");
					}
				} else {
					return res.status(400).send("This promo code not applicable");
				}
			} else {
				return res.status(404).send("Invalid promo code.");
			}
		} else {
			return res.status(404).send("Your cart is empty.");
		}
	} catch (error) {
		console.log("applyCoupon Error:::", error);
		return res.status(500).send('Internal server error.');
	}
}

export async function validateCart(req, res) {
	var queryObj = {};
	var order = "desc";
	const field = "created_on";
	const cartModelName = "Cart";
	const productModelName = "Product";

	const includeArray = [{
		model: model['Product'],
		attributes: ['id', 'product_name']
	}];

	const includeProductArray = [{
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
		attributes: ['id'],
		where: {
			status: status['ACTIVE']
		}
	}];

	queryObj['status'] = status['ACTIVE'];
	queryObj['user_id'] = req.user.id;

	try {
		const cartResonse = await service.findAllRows(cartModelName, includeArray, queryObj, 0, null, field, order);

		if (cartResonse.count) {
			const cartItems = cartResonse.rows;

			for (let cartItem of cartItems) {
				const validProduct = await service.findOneRow(productModelName, {
					id: cartItem.product_id,
					status: status['ACTIVE'],
					quantity_available: {
						'$gte': cartItem.quantity
					}
				}, includeProductArray);
				if (!validProduct) {
					return res.status(400).send(cartItem.Product.product_name + " is currently unable to proceed to checkout.");
					break;
				}
			}
			return res.status(200).send("OK");
		} else {
			return res.status(404).send("Your Shopping Cart is empty.");
		}
	} catch (error) {
		console.log("validateCart Error:::", error);
		return res.status(500).send(error);
	}
}

export function cancelCoupon(req, res) {
	res.clearCookie('applied_coupon');
	return res.status(200).send('Coupon Removed Successfully.');
}

export function checkAlreadySubscribed(req, res) {
	var product_id, user_id, subscriptionQueryObj = {};

	product_id = req.params.id;
	user_id = req.user.id;

	subscriptionQueryObj = {
		user_id: user_id,
		product_id: product_id,
		status: status['ACTIVE']
	}

	service.findOneRow('Subscription', subscriptionQueryObj)
		.then(function(SubscriptionExist) {
			if (SubscriptionExist) {
				return res.status(200).send(SubscriptionExist);
			} else {
				return res.status(200).send(null);
			}
		}).catch(function() {
			return res.status(400).send("Internal Server Error");
		})
}

function checkAlreadySubscribetion(productID, user) {
	var product_id, user_id, subscriptionQueryObj = {};

	product_id = productID;
	user_id = user.id;

	subscriptionQueryObj = {
		user_id: user_id,
		product_id: product_id,
		status: status['ACTIVE']
	}

	return service.findOneRow('Subscription', subscriptionQueryObj)
		.then(function(SubscriptionExist) {
			if (SubscriptionExist) {
				return true; //res.status(200).send(SubscriptionExist);
			} else {
				return false; //res.status(200).send(null);
			}
		}).catch(function() {
			return res.status(400).send("Internal Server Error");
		})
}