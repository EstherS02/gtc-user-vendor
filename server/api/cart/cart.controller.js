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
			message_details: "Please Enter the Quantity you want"
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
			}
		});
		if (productResponse) {
			const product = productResponse.toJSON();
			console.log("product", product);
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

function addToCartAction(product, orderQuantity, LoggedInUser) {
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

				var checkCartUpdateQuantity = product.quantity_available - cart.quantity;

				if (orderQuantity > checkCartUpdateQuantity) {
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
					cartUpdateObj['quantity'] = cartResult.quantity + orderQuantity;
					cartUpdateObj['last_updated_by'] = LoggedInUser.first_name + " " + LoggedInUser.last_name;
					cartUpdateObj['last_updated_on'] = new Date();
					cartUpdateObj['status'] = status["ACTIVE"];

					return model["Cart"].update(cartUpdateObj, {
						where: {
							id: cartResult.id,
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

export function removeCart(req, res) {
	service.destroyRow('Cart', req.params.id)
		.then(function(result) {
			console.log(result)
			return res.status(200).send(result);
		}).catch(function(error) {
			console.log('Error :::', error);
			return res.status(500).send("Internal server error");
		});
}

export function updateCart(req, res) {
	let updateCartItems = req.body.cartUpdateArray;

	async.mapSeries(updateCartItems, function(item, cb) {
		let product_id = parseInt(item.product_id);
		let order_qty = parseInt(item.product_quantity);
		let cart_item_id = parseInt(item.cart_item_id);
		var LoggedInUser = {};

		if (req.user)
			LoggedInUser = req.user;

		let user_id = LoggedInUser.id;

		if (order_qty > 0) {
			model["Product"].findOne({
					where: {
						id: product_id,
						status: status["ACTIVE"]
					}
				})
				.then(function(productResult) {
					if (productResult) {
						productResult = plainTextResponse(productResult);

						if (parseInt(productResult.quantity_available) == 0) {
							return cb({
								statusCode: 400,
								message: "SOLD_OUT",
								message_details: "OOPS ! This product sold out, seller has no more left",
								cart_item_id: cart_item_id
							});

						} else if (order_qty > productResult.quantity_available) {
							return cb({
								statusCode: 400,
								message: "EXCEEDING_AVAILABLITY",
								message_details: "This seller have only " + productResult.quantity_available + " Items of this product",
								available_state: productResult.quantity_available,
								cart_item_id: cart_item_id
							})

						} else {
							var cartSearchObj = {}
							cartSearchObj['user_id'] = user_id;
							cartSearchObj['product_id'] = productResult.id;
							cartSearchObj['status'] = status["ACTIVE"];

							return model["Cart"].findOne({
								where: cartSearchObj
							}).then(function(cartResult) {
								if (cartResult) {
									cartResult = plainTextResponse(cartResult);

									var checkCartUpdateQuantity = productResult.quantity_available - cartResult.quantity;
									var cartUpdateObj = {};

									cartUpdateObj['quantity'] = order_qty;
									cartUpdateObj['last_updated_by'] = LoggedInUser.first_name + " " + LoggedInUser.last_name;
									cartUpdateObj['last_updated_on'] = new Date();
									cartUpdateObj['status'] = status["ACTIVE"];

									return model["Cart"].update(cartUpdateObj, {
										where: {
											id: cartResult.id,
											status: status["ACTIVE"]
										}
									}).then(function(updatedCartResult) {
										if (updatedCartResult) {
											return cb(null, {
												statusCode: 200,
												message: "SUCCESS",
												message_details: "Product already in cart, Product quantity updated to " + cartUpdateObj['quantity'],
												cart_item_id: cart_item_id
											})
										} else {
											return cb({
												statusCode: 500,
												message: "ERROR",
												message_details: "Internal Server Error, Unable to add to cart.",
												cart_item_id: cart_item_id
											})
										}
									}).catch(function(error) {
										console.log('Error:::', error);
										return cb({
											statusCode: 500,
											message: "ERROR",
											message_details: "Internal Server Error, Unable to add to cart.",
											cart_item_id: cart_item_id
										})
									})
								} else {
									var createCartObj = {};
									createCartObj["user_id"] = user_id;
									createCartObj["product_id"] = productResult.id;
									createCartObj["quantity"] = order_qty;
									createCartObj["status"] = status.ACTIVE;
									createCartObj["created_by"] = LoggedInUser.first_name + " " + LoggedInUser.last_name;
									createCartObj["created_on"] = new Date();
									model["Cart"].create(createCartObj)
										.then(function(createdCartResult) {
											if (createdCartResult) {
												return cb(null, {
													statusCode: 200,
													message: "SUCCESS",
													message_details: "Product successfully added to cart",
													cart_item_id: cart_item_id
												});
											} else {
												return cb({
													statusCode: 500,
													message: "ERROR",
													message_details: "Internal Server Error, Unable to add to cart.",
													cart_item_id: cart_item_id
												})
											}
										}).catch(function(error) {
											console.log('Error:::', error);
											return cb({
												statusCode: 500,
												message: "ERROR",
												message_details: "Internal Server Error, Unable to add to cart.",
												cart_item_id: cart_item_id
											});
										});
								}
							}).catch(function(error) {
								console.log('Error:::', error);
								return cb({
									statusCode: 500,
									message: "ERROR",
									message_details: "Internal Server Error, Unable to add to cart.",
									cart_item_id: cart_item_id
								});
							})
						}
					} else {
						return cb({
							statusCode: 404,
							message: "NOT_FOUND",
							message_details: "Product not found",
							cart_item_id: cart_item_id
						});
					}
				}).catch(function(error) {
					console.log('Error:::', error);

					return cb({
						statusCode: 500,
						message: "ERROR",
						message_details: "Internal Server Error, Unable to add to cart.",
						cart_item_id: cart_item_id
					});
				})
		} else {
			return cb({
				statusCode: 400,
				message: "NO_QUANTITY",
				message_details: "Please Enter the Quantity you want",
				cart_item_id: cart_item_id
			});
		}
	}, function done(err, success) {
		if (err)
			return res.status(err.statusCode).json(err);
		return res.status(200).json({
			statusCode: 200,
			message: "QUANTITY_UPDATED",
			message_details: "Quantity updated successfully",
		});
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
							const existingCount = await service.countRows(orderModelName, {
								coupon_id: coupon.id
							});
							if (existingCount > coupon.usage_limit) {
								return res.status(400).send("Promo code limit exceeded.");
							}
						}
						if (coupon.usage_limit_per_user) {
							const existingCount = await service.countRows(orderModelName, {
								coupon_id: coupon.id,
								user_id: req.user.id
							});
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

						if (appliedProducts.length > appliedCategoryProducts.length) {
							var tmpProducts = await _.map(appliedCategoryProducts, 'id');
							finalProducts = await _.filter(appliedProducts, function(product) {
								return tmpProducts.indexOf(product.id) > -1;
							});
						} else if (appliedCategoryProducts.length > appliedProducts.length) {
							var tmpProducts = await _.map(appliedProducts, 'id');
							finalProducts = await _.filter(appliedCategoryProducts, function(product) {
								return tmpProducts.indexOf(product.id) > -1;
							});
						} else {
							var tmpProducts = await _.map(appliedCategoryProducts, 'id');
							finalProducts = await _.filter(appliedProducts, function(product) {
								return tmpProducts.indexOf(product.id) > -1;
							});
						}

						var totalAmount = 0;

						await Promise.all(finalProducts.map(async (product) => {
							const cartProduct = await vendorProductsInCart.find((obj) => obj.product_id == product.id);
							if (cartProduct) {
								totalAmount = await cartProduct.Product.price * cartProduct.quantity;
							}
						}));
						if (totalAmount <= coupon.minimum_spend) {
							return res.status(400).send("This promo code not applicable. Minimum spend " + coupon.minimum_spend);
						} else if (totalAmount >= coupon.maximum_spend) {
							return res.status(400).send("This promo code not applicable. Maximum spend " + coupon.maximum_spend);
						} else {
							res.cookie("applied_coupon", coupon.code);
							return res.status(200).send("Promo code applied successfully.");
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

export function cancelCoupon(req,res){
	res.clearCookie('applied_coupon');
	return res.status(200).send('Coupon Removed Successfully.');
}
function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}