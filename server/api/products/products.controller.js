'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
import Sequelize from 'sequelize';

const Op = Sequelize.Op;

export function productDec(req, res) {

	console.log("comming", req.params.id);

	model['Product'].findById(req.params.id)
		.then(function(row) {
			if (row) {

				model['Product'].update({
						quantity_available: (row.quantity_available - 1)
					}, {
						where: {
							id: req.params.id
						},
						individualHooks: true
					})
					.then(function(row) {
						res.status(200).send(row);
						return;
					}).catch(function(err) {
						res.send(err);
						return;
					});
			} else {

				res.status(404).send("Not Found");
				return;

			}
		})
		.catch(function(err) {	
			res.send(err);
			return;
		});
}

export function totalPrice(req, res) {

	var totalPrice;
	var quantity = req.query.quantity;

	console.log("req.query", req.query.id)

	model['Product'].findOne({
			include: [{
				all: true
			}],
			where: {
				id: req.query.id
			}

		}).then(function(row) {
			if (row) {
				totalPrice = row.price * quantity;

				console.log("Total price=", totalPrice);

				res.status(404).send("Total price Calculated");
				return;
			} else {
				res.status(404).send(" Found");
				return;
			}

		})
		.catch(function(error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}

export function couponExp(req, res){

	model['Coupon'].update({	
			status: 10
		}, {
			where: {
				expiry_date : {	
					[Op.lt]:new Date()
				}
			},
			individualHooks: true
		})
		.then(function(row) {
			res.status(200).send("Updated");
			return;
		}).catch(function(err) {
			res.send(err);
			return;
		});
}