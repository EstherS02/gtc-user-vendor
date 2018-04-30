'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');

export function index(req, res) {

	model["VendorPlan"].find({
		where: req.query
	})
	.then(function(row) {
		if (row) {
			model["PlanMarketplace"].find({
				where: {
					plan_id: row.plan_id
				}
			})
			.then(function(row) {
				if (row) {

					res.status(200).send(row);
					return;
				} else {
					res.status(404).send("Not Found");
					return;
				}
			})
			.catch(function(error) {
				if (error) {
					res.status(500).send(error);
					return;
				}
			})
		} else {
			res.status(404).send("Not Found");
			return;
		}
	})
	.catch(function(error) {
		if (error) {
			res.status(500).send(error);
			return;
		}
	})
}

