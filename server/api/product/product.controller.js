'	use strict';

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

export function featureMany(req, res) {
	const ids = req.body.ids;
	console.log(ids);
	// model[req.endpoint].update({
	// 	status: status["DELETED"],
	// 	deleted_at: new Date()
	// }, {
	// 	where: {
	// 		id: ids
	// 	}
	// }).then(function(rows) {
	// 	if (rows[0] > 0) {
	// 		res.status(200).send(rows);
	// 		return;
	// 	} else {
	// 		res.status(404).send("Unable to delete users");
	// 		return;
	// 	}
	// }).catch(function(error) {
	// 	console.log('Error:::', error);
	// 	res.status(500).send("Internal server error");
	// 	return;
	// })
}

export function featureOne(req, res) {

	console.log("requested parameter id",req.params.id);

	model["Product"].findById(req.params.id)
	.then(function(row) {

		if (row) {
			var obj= {};

			obj['product_id']= row.id;
			obj['status']=1;
			obj['start_date']= new Date();
			obj['created_on'] = new Date();

			model["FeaturedProduct"].create(obj)
			.then(function(row) {
				res.status(201).send("Created");
				return;
			})
			.catch(function(error) {
				if (error) {
					res.status(500).send(error);
					return;
				}
			});
		} else {
			res.status(404).send("Not found");
			return;
		}
	}).catch(function(error) {
		console.log('Error:::', error);
		res.status(500).send("Internal server error");
		return;
	})
}

