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

export function addToCartOld(req, res) {
	let product_id = parseInt(req.params.id);
	let order_qty = parseInt(req.body.product_quantity);
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
						return res.status(400).json({
							message: "SOLD_OUT",
							message_details: "OOPS ! This product sold out, seller has no more left"
						});
					} else if (order_qty > productResult.quantity_available) {
						return res.status(400).json({
							message: "EXCEEDING_AVAILABLITY",
							message_details: "This seller have only " + productResult.quantity_available + " Items of this product",
							available_state: productResult.quantity_available
						});

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

								if (order_qty > checkCartUpdateQuantity) {

									var responseMessage;

									if (parseInt(checkCartUpdateQuantity) == 0)
										responseMessage = "Already you have " + cartResult.quantity + " Quantities of this Product in your cart, This seller has no remaining product";
									else
										responseMessage = "Already you have " + cartResult.quantity + " Quantities of this Product in your cart, This seller only have " + checkCartUpdateQuantity + " Remaining";

									return res.status(400).json({
										message: "EXCEEDING_AVAILABLITY",
										message_details: responseMessage,
										available_state: checkCartUpdateQuantity
									});
								} else {
									var cartUpdateObj = {};
									cartUpdateObj['quantity'] = cartResult.quantity + order_qty;
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
											return res.status(200).json({
												message: "SUCCESS",
												message_details: "Product already in cart, Product quantity updated to " + cartUpdateObj['quantity']
											});
										} else {
											return res.status(500).json({
												message: "ERROR",
												message_details: "Internal Server Error, Unable to add to cart."
											});
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
								createCartObj["user_id"] = user_id;
								createCartObj["product_id"] = productResult.id;
								createCartObj["quantity"] = order_qty;
								createCartObj["status"] = status.ACTIVE;
								createCartObj["created_by"] = LoggedInUser.first_name + " " + LoggedInUser.last_name;
								createCartObj["created_on"] = new Date();

								model["Cart"].create(createCartObj)
									.then(function(createdCartResult) {
										if (createdCartResult) {
											return res.status(200).json({
												message: "SUCCESS",
												message_details: "Product successfully added to cart"
											});
										} else {
											return res.status(500).json({
												message: "ERROR",
												message_details: "Internal Server Error, Unable to add to cart."
											});
										}
									}).catch(function(error) {
										console.log('Error:::', error);
										return res.status(500).json({
											message: "ERROR",
											message_details: "Internal Server Error, Unable to add to cart."
										});
									});
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
					return res.status(404).json({
						message: "NOT_FOUND",
						message_details: "Product not found"
					});
				}
			}).catch(function(error) {
				console.log('Error:::', error);
				return res.status(500).json({
					message: "ERROR",
					message_details: "Internal Server Error, Unable to add to cart."
				});
			});
	} else {
		return res.status(500).json({
			message: "NO_QUANTITY",
			message_details: "Please Enter the Quantity you want"
		});
	}
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

									console.log("quantity_available", productResult.quantity_available)
									console.log("order_qty", order_qty)
									console.log("cartResult", cartResult.quantity)


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
											console.log('Error:::', error); //response

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

		console.log("done", err, success);

		if (err)
			return res.status(err.statusCode).json(err);

		return res.status(200).json({
			statusCode: 200,
			message: "QUANTITY_UPDATED",
			message_details: "Quantity updated successfully",
		});

	});

}

var checkApplyCoupon = function(req, res, callback) {

	let LoggedInUser = {};
	let appliedCouponObj;
	let userCartObj;
	let totalPrice = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	async.series({

		CouponExist: function(cb) {

			//Coupon Exist ?

			let searchObj = {};

			searchObj['code'] = req.body.coupon_code;
			searchObj['status'] = status["ACTIVE"]

			model['Coupon'].findOne({
				include: [{
					"model": model['CouponCategory'],
					where: {
						status: status["ACTIVE"]
					},
					required: false
				}, {
					"model": model['CouponProduct'],
					where: {
						status: status["ACTIVE"]
					},
					required: false
				}, {
					"model": model['CouponExcludedCategory'],
					where: {
						status: status["ACTIVE"]
					},
					required: false
				}, {
					"model": model['CouponExcludedProduct'],
					where: {
						status: status["ACTIVE"]
					},
					required: false
				}],
				where: searchObj
			}).then(function(couponRow) {
				if (couponRow) {
					appliedCouponObj = couponRow.toJSON();
					return cb(null, appliedCouponObj);
				} else {
					return cb({
						status: "error",
						message: "COUPON_INVALID",
						message_details: "Sorry !, Invalid Coupon"
					});
				}
			}).catch(function(error) {
				console.log('Error :::', error);
				return cb({
					message: "INTERNAL_SERVER_ERROR",
					message_details: "Unexpected Internal Server Error Occurred ! Try Again."
				});
			});
		},

		CouponExpired: function(cb) {

			let currentUTCDate = moment.utc().format('YYYY-MM-DD');
			let couponExpiryDate = appliedCouponObj.expiry_date;

			let isCouponNotExpired = moment(currentUTCDate).isSameOrBefore(couponExpiryDate);

			if (isCouponNotExpired) {
				return cb(null, {
					isCouponNotExpired: isCouponNotExpired
				});
			} else {
				return cb({
					status: "error",
					message: "COUPON_EXPIRED",
					message_details: "Sorry !, Coupon is Expired"
				});
			}

		},

		CouponAvailable: function(cb) {

			if (appliedCouponObj.usage_limit !== null) {
				if (parseInt(appliedCouponObj.usage_limit) > 0) {
					return cb(null, {
						isCouponAvailable: true
					});
				} else {
					return cb({
						status: "error",
						message: "COUPON_NOT_AVAILABLE",
						message_details: "Sorry !, Coupon Not Available"
					});
				}
			} else {
				return cb(null, {
					isCouponAvailable: true
				});
			}

		},

		CouponAvailableToUser: function(cb) {

			let queryObj = {};

			queryObj['user_id'] = user_id;
			queryObj['coupon_id'] = appliedCouponObj.id;

			model["Order"].findAndCountAll({
				where: queryObj,
				order: [
					['coupon_applied_on', 'DESC']
				]
			}).then(function(OrderRows) {
				OrderRows = JSON.parse(JSON.stringify(OrderRows));
				// console.log(OrderRows)
				// return false;
				if (OrderRows && parseInt(OrderRows.count) > 0) {
					let currentUTCDate = moment.utc().format('YYYY-MM-DD');
					let lastestOrderDate = OrderRows.rows[0].coupon_applied_on;


					if (moment(currentUTCDate).isSame(lastestOrderDate)) {
						return cb({
							status: "error",
							message: "COUPON_APPLIED_MULTIPLE_TIMES",
							message_details: "Sorry !, User Already Used this Coupon Today"
						});
					}

					if (appliedCouponObj.usage_limit_per_user !== null) {
						if (parseInt(appliedCouponObj.usage_limit_per_user) > 0) {
							if (parseInt(appliedCouponObj.usage_limit_per_user) >= parseInt(OrderRows.count)) {
								return cb(null, {
									CouponUsageBefore: OrderRows.count,
									isCouponPerUserLimitNotExceeded: true,
									isCouponNotAppliedMultipleTimes: true
								});
							} else {
								return cb({
									status: "error",
									message: "COUPON_USER_LIMIT_EXCEEDED",
									message_details: "Sorry !, Coupon Limit Exceeded by User"
								});
							}
						} else {
							return cb({
								status: "error",
								message: "COUPON_LIMIT_EXCEEDED",
								message_details: "Sorry !, Coupon Limit Exceeded or Unavailable"
							});
						}
					} else {
						return cb(null, {
							CouponUsageBefore: OrderRows.count,
							isCouponPerUserLimitNotExceeded: true,
							isCouponNotAppliedMultipleTimes: true
						});
					}

				} else {
					return cb(null, {
						CouponUsageBefore: OrderRows.count,
						isCouponPerUserLimitNotExceeded: true,
						isCouponNotAppliedMultipleTimes: true
					});
				}

			}).catch(function(error) {
				console.log(error);
				return cb({
					status: "error",
					message: "INTERNAL_SERVER_ERROR",
					message_details: "Unexpected Internal Server Error Occurred ! Try Again."
				});
			});

		},

		CartFetch: function(cb) {

			let queryObj = {};
			queryObj['user_id'] = user_id;

			queryObj['status'] = {
				'$eq': status["ACTIVE"]
			}

			model["Cart"].findAndCountAll({
				where: queryObj,
				include: [{
					model: model["User"],
					attributes: {
						exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
					}
				}, {
					model: model["Product"],
					include: [{
						model: model["Vendor"]
					}, {
						model: model["Category"]
					}, {
						model: model["SubCategory"]
					}, {
						model: model["Marketplace"]
					}, {
						model: model["MarketplaceType"]
					}, ]
				}]
			}).then(function(cartFetchResult) {
				userCartObj = JSON.parse(JSON.stringify(cartFetchResult));

				let totalItems = userCartObj.rows;
				let defaultShipping = 50;


				totalPrice['grandTotal'] = 0;

				let seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");


				_.forOwn(seperatedItems, function(itemsValue, itemsKey) {
					totalPrice[itemsKey] = {};
					totalPrice[itemsKey]['price'] = 0;
					totalPrice[itemsKey]['shipping'] = 0;
					totalPrice[itemsKey]['total'] = 0;

					for (var i = 0; i < itemsValue.length; i++) {

						if ((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price) {

							var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

							totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
							totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
							totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
						}
					}

					totalPrice['grandTotal'] = totalPrice['grandTotal'] + totalPrice[itemsKey]['total'];
				});

				if (
					totalPrice['grandTotal'] >= parseFloat(appliedCouponObj.minimum_spend) &&
					totalPrice['grandTotal'] <= parseFloat(appliedCouponObj.maximum_spend)
				) {
					return cb(null, {
						totalPrice: totalPrice,
						userCartObj: userCartObj.rows
					});
				} else {
					return cb({
						message: "PRICE_IS_NOT_MATCHED",
						message_details: "Sorry !, Your Order price is not matching for this coupon"
					});
				}
			}).catch(function(error) {
				console.log('Error:::', error);
				return cb({
					message: "INTERNAL_SERVER_ERROR",
					message_details: "Unexpected Internal Server Error Occurred ! Try Again."
				});
			});
		},
		CheckOrderProduct: function(cb) {
			if (appliedCouponObj.limit_usage_to_x_items > 0) {

				let queryObj = {};
				queryObj['coupon_id'] = appliedCouponObj.id;

				model["Order"].findAndCountAll({
					include: [{
						"model": model['OrderItem'],
						where: {
							status: status["ACTIVE"]
						}
					}],
					where: queryObj
				}).then(function(orderFetchResult) {

					var order_products = {};

					let orderProductResult = JSON.parse(JSON.stringify(orderFetchResult));
					for (let value of orderProductResult.rows) {
						var order_items = value.OrderItems;
						for (let value of order_items) {
							if (order_products[value.product_id] == undefined) {
								order_products[value.product_id] = 1;
							} else {
								order_products[value.product_id] = order_products[value.product_id] + 1;
							}
						}
					}

					var product_limit_available = true;
					var product_name = [];
					for (let value of userCartObj.rows) {
						if (order_products[value.product_id] != undefined) {
							if (order_products[value.product_id] >= appliedCouponObj.limit_usage_to_x_items) {
								product_limit_available = false;
								product_name.push(value.Product.product_name);
							}
						}
					}
					var product_name = (product_name.length > 0) ? product_name.join(",") : "";
					if (product_limit_available) {
						return cb(null, {
							isProductLimitAvailable: product_limit_available
						});
					} else {
						return cb({
							message: "COUPON_PRODUCT_LIMIT_EXCEEDED",
							message_details: "Sorry !, Coupon Limit Exceeded by this Product " + product_name
						});
					}
				}).catch(function(error) {
					console.log('Error:::', error);
					return cb({
						message: "INTERNAL_SERVER_ERROR",
						message_details: "Unexpected Internal Server Error Occurred ! Try Again."
					});
				});
			} else {
				return cb({
					message: "COUPON_PRODUCT_LIMIT_EXCEEDED",
					message_details: "Sorry !, Coupon Limit Exceeded by Product"
				});
			}
		},
		checkExclusiveAndIndividual: function(cb) {
			let exclusive_sale = appliedCouponObj.excluse_sale_item;
			let individual_use = appliedCouponObj.individual_use_only;

			if (exclusive_sale == 1) {
				let product_name = [];
				for (let value of userCartObj.rows) {
					if (value.Product.exclusive_sale == exclusive_sale) {
						product_name.push(value.Product.product_name);
					}
				}
				if (product_name.length > 0) {
					product_name = product_name.join(",");
					return cb({
						message: "COUPON_NOT_FOR_EXCLUSIVE",
						message_details: "Sorry !, This Coupon is not applicable for exclusive sale products are " + product_name
					});
				}
			}

			if (individual_use == 1) {
				let product_name = [];
				for (let value of userCartObj.rows) {
					if (value.Product.individual_sale_only != individual_use) {
						product_name.push(value.Product.product_name);
					}
				}
				if (product_name.length > 0) {
					console.log(product_name)
					product_name = product_name.join(",");
					return cb({
						message: "COUPON_IS_FOR_INDIVIDUAL_USE",
						message_details: "Sorry !, This Coupon is for individual use products .These products are not individual use " + product_name
					});
				}
			}
			return cb(null, {});
		},
		checkExcludeProduct: function(cb) {
			let excludedByProducts = validateCouponProduct(userCartObj.rows, appliedCouponObj.CouponExcludedProducts, 'id', 'product_id');
			let excludedByCategories = validateCouponProduct(userCartObj.rows, appliedCouponObj.CouponExcludedCategories, 'product_category_id', 'category_id');
			let isProductsAvailable = validateCouponProduct(userCartObj.rows, appliedCouponObj.CouponProducts, 'id', 'product_id');
			let isCategoriesAvailable = validateCouponProduct(userCartObj.rows, appliedCouponObj.CouponCategories, 'product_category_id', 'category_id');

			if (
				(excludedByProducts == false && excludedByCategories == false) &&
				(isProductsAvailable == true || isCategoriesAvailable == true)
			) {
				return cb(null, {
					excludedByProducts: excludedByProducts,
					excludedByCategories: excludedByCategories,
					isProductsAvailable: isProductsAvailable,
					isCategoriesAvailable: isCategoriesAvailable
				});
			} else {
				return cb({
					message: "INVALID_COUPON_FOR_THIS_PRODUCT",
					message_details: "Sorry !, Coupon is not apply for this products"
				});
			}
		}
	}, function(err, results) {
		if (!err) {
			let discount_value = getDiscountPrice(appliedCouponObj.discount_value, appliedCouponObj.discount_type, totalPrice['grandTotal'], discount);

			let cookie_obj = {
				user_id: user_id,
				coupon_id: appliedCouponObj.id,
				message_details: "Promo Code #" + appliedCouponObj.code + " Appiled <br><b> " + discount_value.discount_by + "</b>",
				original_price: (totalPrice['grandTotal']).toFixed(2),
				discount_price: discount_value.discount_price,
				final_price: discount_value.final_price,
				coupon_code: appliedCouponObj.code
			};

			if (typeof(req.cookies.check_promo_code) == 'undefined') {
				cookie_obj = [cookie_obj];
				res.cookie('check_promo_code', cookie_obj, {
					maxAge: 24 * 60 * 60 * 1000,
					httpOnly: true
				});
			} else {
				let default_promo_obj = req.cookies.check_promo_code;
				let obj_key = -1;

				for (let key in default_promo_obj) {
					if (default_promo_obj[key].user_id == cookie_obj.user_id) {
						obj_key = key;
					}
				}
				if (obj_key > -1) {
					default_promo_obj[obj_key] = cookie_obj;
				} else {
					default_promo_obj.push(cookie_obj);
				}
				res.cookie('check_promo_code', default_promo_obj, {
					maxAge: 24 * 60 * 60 * 1000,
					httpOnly: true
				});
			}

			let return_data = {
				message: "PROMO_CODE_APPLIED",
				message_details: "Promo Code Applied to your order",
				coupon_data: cookie_obj
			}
			callback(return_data);
		} else {
			console.log(err)
			callback(err);
		}
	});

};

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
								return tmpProducts.indexOf(product.id) == -1;
							});
						} else if (appliedCategoryProducts.length > appliedProducts.length) {
							var tmpProducts = await _.map(appliedProducts, 'id');
							finalProducts = await _.filter(appliedCategoryProducts, function(product) {
								return tmpProducts.indexOf(product.id) == -1;
							});
						} else {
							var tmpProducts = await _.map(appliedCategoryProducts, 'id');
							finalProducts = await _.filter(appliedProducts, function(product) {
								return tmpProducts.indexOf(product.id) == -1;
							});
						}

						var totalAmount = 0;

						await Promise.all(finalProducts.map(async (product) => {
							const cartProduct = await vendorProductsInCart.find((obj) => obj.product_id == product.id);
							if (cartProduct) {
								totalAmount = await cartProduct.Product.price * cartProduct.quantity;
							}
						}));
						if (totalAmount < coupon.minimum_spend) {
							return res.status(400).send("This promo code not applicable. Minimum spend " + coupon.minimum_spend);
						} else if (totalAmount > coupon.maximum_spend) {
							return res.status(400).send("This promo code not applicable. Maximum spend " + coupon.maximum_spend);
						} else {
							res.cookie("applied_coupon", coupon.id);
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

export function applyCouponOld(req, res) {
	function callback(return_val) {
		return res.send(return_val);
	}
	checkApplyCoupon(req, res, callback);
}

export function callApplyCoupon(req, res, callback) {
	checkApplyCoupon(req, res, callback);
};

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}

function validateCouponProduct(arrayObj1, arrayObj2, key1, key2) {
	var return_val = false;
	for (let value of arrayObj1) {
		var id = value['Product'][key1];
		for (let value of arrayObj2) {
			if (id == value[key2]) {
				return_val = true;
			}
		}
	}
	return return_val;
}

function getDiscountPrice(discountValue, discountType, totalPrice, discountObj) {
	let discount_type = "";
	var final_price = 0;
	var discount_by = "";

	for (let key in discountObj) {
		if (discountType == discount[key]) {
			discount_type = (key).toLowerCase();
		}
	}
	discountValue = parseFloat(discountValue);
	totalPrice = parseFloat(totalPrice);
	if (discount_type == 'percentage') {
		let discount_value = (discountValue / 100) * totalPrice;
		final_price = totalPrice - discount_value;
		discount_by = (discountValue).toFixed(2) + " % OFF";
		discountValue = discount_value;
	} else {
		final_price = totalPrice - discountValue;
		discount_by = "$" + (discountValue).toFixed(2) + " OFF";
	}

	return {
		final_price: (final_price).toFixed(2),
		discount_price: (discountValue).toFixed(2),
		discount_by: discount_by
	};
}