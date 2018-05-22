'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');

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

				if(order_qty > productResult.quantity_available){
					res.send("You are ordering more");
				}else{
					var cartSearchObj = {}
					cartSearchObj['user_id'] = user_id;
					cartSearchObj['product_id'] = 16 //productResult.id;

					console.log(cartSearchObj)

					model["Cart"].findOne({
							where: cartSearchObj
						}).then(function(cartResult) {
							if (cartResult) {
								//Item already in cart?
								cartResult = plainTextResponse(cartResult);
								console.log(cartResult);

								var cartUpdateObj = {};
								cartUpdateObj['quantity'] = cartResult.quantity + order_qty;

								model["Cart"].update(cartUpdateObj, {
									where: {
										id: cartResult.id
									}
								}).then(function(updatedCartResult) {
									if (updatedCartResult) {
										console.log("successfully updated", updatedCartResult)
									} else {
										console.log("unable to add to the cart")
									}
								}).catch(function(error) {
									console.log('Error:::', error);
									return res.status(500).send("Internal server error");
								})
								
							} else {
								console.log("New Item to cart")
								
							}
					}).catch(function(error) {
						console.log('Error:::', error);
						res.status(500).send("Internal server error");
						return;
					})
					
				}

			} else {
				res.status(404).send("Not found");
				return;
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		})
	}else{
		res.status(500).send("Please Enter the Quantity you want");
	}

}


function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}