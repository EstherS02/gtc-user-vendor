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

export function productComp(req, res) {
	console.log("comming", req.params.id);

	model['Product'].findById(req.params.id)
		.then(function(row) {
			if (row) {
				console.log("row.sub_category_id" + row.sub_category_id)
				model['Product'].findAll({
						where: {
							sub_category_id: row.sub_category_id
						},
						individualHooks: true
					})
					.then(function(rows) {
						res.status(200).send(rows);
						return;
					})
					.catch(function(error) {
						res.status(500).send(error);
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


export function couponExp(req, res){

	var current_date = new Date();
	
	var date = new Date(current_date);

	console.log("date"+date);

	    model['Coupon'].update({	
			status: 15
		}, {
			where: {
				expiry_date : date
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