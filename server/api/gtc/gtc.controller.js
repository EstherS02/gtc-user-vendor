'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');


// To find all the records in the table

export function index(req, res) {

	var offset = parseInt(req.query.offset) || 0;
	var limit = parseInt(req.query.limit) || 10;
	var field = req.query.field || 'id';
	var order = req.query.order || 'ASC';


	model[req.endpoint].findAndCountAll({
			include: [{
				all: true
			}],
			offset: offset,
			limit: limit,
			order: [
				[field, order]
			]
		})
		.then(function(rows) {
			res.status(200).send(rows);
			return;

		})
		.catch(function(error) {
			res.status(500).send(error);
			return;
		});
}

// To find first record of the table	

export function show(req, res) {

	 console.log("req.query.condition", req.query);

	//var condition = req.query.condition;

	model[req.endpoint].findOne({
			include: [{
				all: true
			}],
             where:  req.query
			//where: condition
		}).then(function(row) {
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
		});
}

//  To find the record of known id

export function findById(req, res) {

	model[req.endpoint].findById(req.params.id)
		.then(function(row) {
			if (row) {
				res.status(200).send(row);
				return
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
		});
}

// To create

export function create(req, res) {
	req.body['created_on'] = new Date();

	model[req.endpoint].create(req.body)
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
}

// To update 



export function update(req, res) {
	model[req.endpoint].find({
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(function(entity) {
			if (entity) {
				model[req.endpoint].update(req.body,{
						where: {
							id: req.params.id
						},
						individualHooks: true
					})
					.then(() => {
						res.status(200).send("Updated");
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


// For soft delete


export function softDelete(req, res) {
	if (req.body.id) {
		Reflect.deleteProperty(req.body, 'id');
	}

	req.body['deleted_at'] = new Date();

	model[req.endpoint].update({
			status: 10
		}, {
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(function(rows) {

			res.status(200).send(rows);
			return;

		})
		.catch(function(error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}

//To deleted


export function destroy(req, res) {
	model[req.endpoint].find({
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(function(entity) {
			if (entity) {
				model[req.endpoint].destroy({
						where: {
							id: req.params.id
						},
						individualHooks: true
					})
					.then(() => {
						res.status(200).send("Deleted");
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
/*

export function create(req, res, next) {
	var bodyParams = req.body;

	model[req.endpoint].create(bodyParams)
		.then(function(row) {
			console.log('row', plainTextResponse(row));
		})
		.catch(function(error) {
			console.log('error', error);
		});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}

*/