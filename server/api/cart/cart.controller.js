'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status');
const async = require('async');
const _ = require('lodash');
const moment = require('moment');

export function addToCart(req, res){

	console.log(req.body);
	let product_id = parseInt(req.params.id);
	let order_qty = parseInt(req.body.product_quantity);
	var LoggedInUser = {};

	if(req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	if(order_qty > 0){
		model["Product"].findOne({
			where : {
				id: product_id,
				status: status["ACTIVE"]
			}
		})
		.then(function(productResult) {
			if (productResult) {
				productResult = plainTextResponse(productResult);

				if(parseInt(productResult.quantity_available) == 0){
					
					return res.status(400).json({
						message : "SOLD_OUT",
						message_details : "OOPS ! This product sold out, seller has no more left"
					});

				} else if(order_qty > productResult.quantity_available){
					
					return res.status(400).json({
						message : "EXCEEDING_AVAILABLITY",
						message_details : "This seller have only " + productResult.quantity_available + "Items of this product",
						available_state: productResult.quantity_available				 
					});
					
				} else{
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

								if(order_qty > checkCartUpdateQuantity){

									var responseMessage;
									
									if(parseInt(checkCartUpdateQuantity) == 0)
										responseMessage = "Already you have " + cartResult.quantity + " Quantities of this Product in your cart, This seller has no remaining product";
									else
										responseMessage = "Already you have " + cartResult.quantity + " Quantities of this Product in your cart, This seller only have " + checkCartUpdateQuantity + " Remaining";
									
									return res.status(400).json({
										message : "EXCEEDING_AVAILABLITY",
										message_details : responseMessage,
										available_state: checkCartUpdateQuantity
									});

								}else{
									var cartUpdateObj = {};
									cartUpdateObj['quantity'] = cartResult.quantity + order_qty;
									cartUpdateObj['last_updated_by'] = LoggedInUser.first_name + " "+ LoggedInUser.last_name;
									cartUpdateObj['last_updated_on'] = new Date();
									cartUpdateObj['status'] = status["ACTIVE"];

									return model["Cart"].update(cartUpdateObj, {
										where: {
											id: cartResult.id,
											status : status["ACTIVE"]
										}
									}).then(function(updatedCartResult) {
										if (updatedCartResult) {
											return res.status(200).json({
												message : "SUCCESS",
												message_details : "Product already in cart, Product quantity updated to " + cartUpdateObj['quantity']
											});
										} else {
											return res.status(500).json({
												message : "ERROR",
												message_details : "Internal Server Error, Unable to add to cart."
											});
										}
									}).catch(function(error) {
										console.log('Error:::', error);
										return res.status(500).json({
											message : "ERROR",
											message_details : "Internal Server Error, Unable to add to cart."
										});
									})
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
											message : "SUCCESS",
											message_details : "Product successfully added to cart"
										});
									} else {
										return res.status(500).json({
											message : "ERROR",
											message_details : "Internal Server Error, Unable to add to cart."
										});
									}
								}).catch(function(error) {
										console.log('Error:::', error);
										return res.status(500).json({
											message : "ERROR",
											message_details : "Internal Server Error, Unable to add to cart."
										});
								});
								
							}
					}).catch(function(error) {
						console.log('Error:::', error);
						return res.status(500).json({
							message : "ERROR",
							message_details : "Internal Server Error, Unable to add to cart."
						});
					})
					
				}

			} else {
				return res.status(404).json({
					message : "NOT_FOUND",
					message_details : "Product not found"
				});
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			return res.status(500).json({
				message : "ERROR",
				message_details : "Internal Server Error, Unable to add to cart."
			});
		})
	}else{
		return res.status(500).json({
			message : "NO_QUANTITY",
			message_details : "Please Enter the Quantity you want"
		});
	}

}

export function removeCart(req, res){
	
	service.destroyRow('Cart', req.params.id)
	.then(function(result) {
		console.log(result)
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error :::', error);
		return res.status(500).send("Internal server error");
	});
}

export function updateCart(req, res){


/* 	service.updateRow('Cart', {},req.params.id)
	.then(function(result) {
		console.log(result)
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error :::', error);
		return res.status(500).send("Internal server error");
	}); */
}


export function applyCoupon(req, res){

	let LoggedInUser = {};
	let appliedCouponObj;
	let userCartObj;
	let totalPrice = {};

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;

    async.series({

		CouponExist : function(cb) {

			//Coupon Exist ?

			let searchObj = {};

			searchObj['code'] = req.body.coupon_code;
			searchObj['status'] = status["ACTIVE"]
		
			model['Coupon'].findOne({
				include: [
					{ 
						"model": model['CouponCategory'],
						where : {
							status : status["ACTIVE"]
						}
					},
					{
						"model": model['CouponProduct'], 
						where : {
							status : status["ACTIVE"]
						}
					},
					{ 
						"model": model['CouponExcludedCategory'],
						where : {
							status : status["ACTIVE"]
						}
					},
					{ 
						"model": model['CouponExcludedProduct'],
						where : {
							status : status["ACTIVE"]
						}
					}
				],
				where: searchObj
			}).then(function(couponRow) {
					if (couponRow) {
						appliedCouponObj = couponRow.toJSON();
						return cb(null, appliedCouponObj);
					}else{
						return cb({
							message : "COUPON_INVALID",
							message_details : "Sorry !, Invalid Coupon"
						});
					}
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return cb({
						message : "INTERNAL_SERVER_ERROR",
						message_details : "Unexpected Internal Server Error Occurred ! Try Again."
					});
                });
		},

		CouponExpired : function(cb){
			
			let currentUTCDate = moment.utc().format('YYYY-MM-DD');
			let couponExpiryDate = appliedCouponObj.expiry_date;

			let isCouponNotExpired = moment(currentUTCDate).isSameOrBefore(couponExpiryDate);

			if(isCouponNotExpired){
				return cb(null, { 
					isCouponNotExpired : isCouponNotExpired
				});
			}else{
				return cb({
					message : "COUPON_EXPIRED",
					message_details : "Sorry !, Coupon is Expired"
				});
			}

		},

		CouponAvailable : function(cb){
			
			if(appliedCouponObj.usage_limit !== null){
				if(parseInt(appliedCouponObj.usage_limit) > 0){
					return cb(null, { 
						isCouponAvailable : true
					});
				}else{
					return cb({
						message : "COUPON_NOT_AVAILABLE",
						message_details : "Sorry !, Coupon Not Available"
					});
				}
			}else{
				return cb(null, { 
					isCouponAvailable : true
				});
			}

		},

		CouponAvailableToUser : function(cb){

				let queryObj = {};

				queryObj['user_id'] = user_id;
				queryObj['coupon_id'] = appliedCouponObj.id;

				model["Order"].findAndCountAll({
					where: queryObj,
					order: [
						['coupon_applied_on', 'DESC']
					]
				}).then(function (OrderRows) {
					OrderRows = JSON.parse(JSON.stringify(OrderRows));

					if(OrderRows && parseInt(OrderRows.count) > 0){
						let currentUTCDate = moment.utc().format('YYYY-MM-DD');
						let lastestOrderDate = OrderRows.rows[0].coupon_applied_on;
						
						
						if(moment(currentUTCDate).isSame(lastestOrderDate)){
							return cb({
								message : "COUPON_APPLIED_MULTIPLE_TIMES",
								message_details : "Sorry !, User Already Used this Coupon Today"
							});
						}

						if(appliedCouponObj.usage_limit_per_user !== null){
							if(parseInt(appliedCouponObj.usage_limit_per_user) > 0){
								if(parseInt(appliedCouponObj.usage_limit_per_user) >= parseInt(OrderRows.count)){
									return cb(null, {
										CouponUsageBefore : OrderRows.count,
										isCouponPerUserLimitNotExceeded : true,
										isCouponNotAppliedMultipleTimes : true
									});
								}else{
									return cb({
										message : "COUPON_USER_LIMIT_EXCEEDED",
										message_details : "Sorry !, Coupon Limit Exceeded by User"
									});	
								}
							}else{
								return cb({
									message : "COUPON_LIMIT_EXCEEDED",
									message_details : "Sorry !, Coupon Limit Exceeded or Unavailable"
								});
							}
						}else{
							return cb(null, { 
								CouponUsageBefore : OrderRows.count,
								isCouponPerUserLimitNotExceeded : true,
								isCouponNotAppliedMultipleTimes : true
							});
						}

					}else{
						return cb(null, { 
							CouponUsageBefore : OrderRows.count,
							isCouponPerUserLimitNotExceeded : true,
							isCouponNotAppliedMultipleTimes : true
						});
					}

				}).catch(function (error) {
					console.log(error);
					return cb({
						message : "INTERNAL_SERVER_ERROR",
						message_details : "Unexpected Internal Server Error Occurred ! Try Again."
					});
				});
			
		},

		CartFetch : function(cb){

			let queryObj = {};
            queryObj['user_id'] = user_id;

            queryObj['status'] = {
                '$eq': status["ACTIVE"]
            }

			model["Cart"].findAndCountAll({
                where: queryObj,
                include: [
					{ model: model["User"],
						attributes: {
							exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
						} 
					},
                    {
                        model: model["Product"],
                        include: [
                            { model: model["Vendor"]},
                            { model: model["Category"]},
                            { model: model["SubCategory"]},
                            { model: model["Marketplace"]},
                            { model: model["MarketplaceType"]},
                        ]
                    }
                ]
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

				return cb(null, { 
					totalPrice : totalPrice,
					userCartObj : userCartObj.rows
				});
				

            }).catch(function(error) {
                console.log('Error:::', error);
                return cb({
					message : "INTERNAL_SERVER_ERROR",
					message_details : "Unexpected Internal Server Error Occurred ! Try Again."
				});
            });
		},
		CartMustProduct : function(cb){
			
		}


	}, function(err, results) {
        if (!err) {
			console.log("=====dsss==============", results);
			res.send(results)
		} else {
            console.log(err)
            return res.status(500).json();
        }
    });

};



function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}