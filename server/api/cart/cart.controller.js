'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status')

export function addToCart(req, res){

	console.log(req.body);
	let product_id = parseInt(req.params.id);
	let order_qty = parseInt(req.body.product_quantity);
	let user_id = 63; //hardcoded devan_user

	if(order_qty > 0){
		model["Product"].findById(product_id)
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
									cartUpdateObj['last_updated_by'] = "devan user";
									cartUpdateObj['last_updated_on'] = new Date();

									return model["Cart"].update(cartUpdateObj, {
										where: {
											id: cartResult.id
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
												message_details : "Internal Server Error, Unable to add to cart.",
											});
										}
									}).catch(function(error) {
										console.log('Error:::', error);
										return res.status(500).json({
											message : "ERROR",
											message_details : "Internal Server Error, Unable to add to cart.",
										});
									})
								}
								
							} else {
		
							 	var createCartObj = {};
								createCartObj["user_id"] = user_id;
								createCartObj["product_id"] = productResult.id;
								createCartObj["quantity"] = order_qty;
								createCartObj["status"] = status.ACTIVE;
								createCartObj["created_by"] = "devan user";
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
											message_details : "Internal Server Error, Unable to add to cart.",
										});
									}
								}).catch(function(error) {
										console.log('Error:::', error);
										return res.status(500).json({
											message : "ERROR",
											message_details : "Internal Server Error, Unable to add to cart.",
										});
								});
								
							}
					}).catch(function(error) {
						console.log('Error:::', error);
						return res.status(500).json({
							message : "ERROR",
							message_details : "Internal Server Error, Unable to add to cart.",
						});
					})
					
				}

			} else {
				return res.status(404).json({
					message : "NOT_FOUND",
					message_details : "Product not found",
				});
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			return res.status(500).json({
				message : "ERROR",
				message_details : "Internal Server Error, Unable to add to cart.",
			});
		})
	}else{
		return res.status(500).json({
			message : "NO_QUANTITY",
			message_details : "Please Enter the Quantity you want",
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



function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}