'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status');
const populate = require('../../utilities/populate')
const _ = require('lodash');
const stripe = require('../../payment/stripe.payment');
var featuredProductModel = 'FeaturedProduct';
const paymentMethod = require('../../config/payment-method');

export function index(req, res) {

	var offset, limit, field, order;
	var queryObj={}, productQueryObj = {};
	var includeArr = [];

	queryObj['status'] = {
			'$ne': status["DELETED"]
		}

	if(req.query.feature_status){
		queryObj['feature_status'] = req.query.feature_status;
	}

	productQueryObj.status = status['ACTIVE'];

	if(req.query.text){
        productQueryObj['product_name']={
			$like:'%' + req.query.text + '%'
		}
    }

    offset = req.query.offset ? parseInt(req.query.offset) : 0;
    delete req.query.offset;
    limit = req.query.limit ? parseInt(req.query.limit) : 10;
    delete req.query.limit;
    field = req.query.field ? req.query.field : "id";
    delete req.query.field;
    order = req.query.order ? req.query.order : "asc";
	delete req.query.order;
	
	includeArr = [{model:model['Product'],
				where: productQueryObj }]

	service.findRows(featuredProductModel, queryObj, offset, limit, field, order, includeArr)
	.then(function(products){
		return res.status(200).send(products);
	}).catch(function(error){
		console.log("Error:::", error);
		return res.status(500).send({
			"message": "ERROR",
			"messageDetails": "Unable to display featured products.",
			"errorDescription": error
		});
	})
}

export function featureProductWithPayment(req, res) {

	if (req.query.product_id) {

		var featureQueryObj = {
			product_id: req.query.product_id
		}

		service.findOneRow(featuredProductModel, featureQueryObj)
			.then(function(row) {
				if (!row) {

					var featuredProductBodyParam = req.query;

					featuredProductBodyParam['status'] = status['ACTIVE'];
					featuredProductBodyParam['created_by'] = req.user.Vendor.vendor_name;
					featuredProductBodyParam['created_on'] = new Date();

					service.findIdRow('PaymentSetting', req.body.payment_details, [])
						.then(function(cardDetails) {

							return stripe.chargeCustomerCard(cardDetails.stripe_customer_id, cardDetails.stripe_card_id,
								req.body.feature_amount, 'Payment for Featuring Product', 'usd');
						}).then(function(paymentDetails) {

							if (paymentDetails.paid) {

								var paymentObj = {
									date: new Date(paymentDetails.created),
									amount: paymentDetails.amount / 100.0,
									payment_method: paymentMethod['STRIPE'],
									status: status['ACTIVE'],
									payment_response: JSON.stringify(paymentDetails),
									created_by: req.user.Vendor.vendor_name,
									created_on: new Date()
								}
								service.createRow('Payment', paymentObj)
									.then(function(paymentRow) {

										featuredProductBodyParam['payment_id'] = paymentRow.id;

										service.createRow('FeaturedProduct', featuredProductBodyParam)
											.then(function(featuredRow) {
												return res.status(200).send({
													"message": "SUCCESS",
													"messageDetails": "Product Featured Successfully"
												});
											}).catch(function(error) {
												console.log("Error::",error);
												return res.status(400).send({
													"message": "ERROR",
													"messageDetails": "Featuring Product Unsuccessfull. Please try after sometimes",
													"errorDescription": error
												});
											})
									}).catch(function(error) {
										console.log("Error::",error);
										return res.status(400).send({
											"message": "ERROR",
											"messageDetails": "Featuring Product Unsuccessfull. Please try after sometimes",
											"errorDescription": error
										});
									})
							} else {
								return res.status(500).send({
									"message": "ERROR",
									"messageDetails": "Featuring Product UnSuccessfull with Stripe Payment Error. Please try after sometimes"
								});
							}
						}).catch(function(error) {
							console.log("Error::",error);
							return res.status(500).send({
								"message": "ERROR",
								"messageDetails": "Featuring Product UnSuccessfull with Error.Please try after sometimes",
								"errorDescription": error
							});
						})
				} else {
					return res.status(200).send({
						"message": "MESSAGE",
						"messageDetails": "You have already featured this product."
					});
				}
			}).catch(function(error) {
				return res.status(500).send({
					"message": "ERROR",
					"messageDetails": "Featuring Product UnSuccessfull with Error.Please try after sometimes",
					"errorDescription": error
				});
			});
	}
}

export function featureProductWithoutPayment(req, res){

	if (req.body.product_id) {
		var featureQueryObj = {
			product_id: req.body.product_id
		}
		service.findOneRow(featuredProductModel, featureQueryObj)
			.then(function(row) {
				if (!row) {
					var featuredProductBodyParam = req.body;
					featuredProductBodyParam['status'] =status.ACTIVE;
					featuredProductBodyParam['created_by'] = req.user.first_name;
					featuredProductBodyParam['created_on'] = new Date();
					service.createRow(featuredProductModel, featuredProductBodyParam)
						.then(function(featuredRow) {
							return res.status(200).send({
								"message": "SUCCESS",
								"messageDetails": "Product Featured Successfully"
							});
						}).catch(function(error) {
							console.log("Error::",error);
							return res.status(400).send({
								"message": "ERROR",
								"messageDetails": "Featuring Product Unsuccessfull. Please try after sometimes",
								"errorDescription": error
							});
						})
				}else {
						return res.status(200).send({
							"message": "MESSAGE",
							"messageDetails": "You have already featured this product."
						});
					}
			}).catch(function(error) {
				console.log("Error::",error);
				return res.status(500).send({
					"message": "ERROR",
					"messageDetails": "Featuring Product UnSuccessfull with Error.Please try after sometimes",
					"errorDescription": error
				});
			});
	}
}