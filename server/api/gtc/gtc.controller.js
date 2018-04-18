'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');


// To find all the records in the table

export function index(req, res) {

	console.log(req.query.offset);
    console.log(req.query.limit);
    console.log(req.query.field);
    console.log(req.query.order);
   
/*
	var offset = JSON.parse(req.query.offset) || 0;
	var limit = JSON.parse(req.query.limit) || 10;
	var field = req.query.field || 'id';
	var order =req.query.order || 'ASC';
	*/

	var offset = req.query.offset || 0;
	var limit = req.query.limit || 10;
	var field = req.query.field || 'id';
	var order =req.query.order || 'ASC';

	console.log(model[req.endpoint])

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
			if (rows) {
				res.status(200).send(rows);
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

// To find first record of the table	

export function show(req, res) {

	var includeArr = [];

	for(var i=0; i<reference[req.endpoint].length; i++){
		if(typeof reference[req.endpoint][i] === 'object'){
			includeArr.push({
				model: model[reference[req.endpoint][i].model_name],
				as: reference[req.endpoint][i].model_as
			});
		}else{
			includeArr.push({
				model: model[reference[req.endpoint][i]]
			});
		} 
	}

	console.log("includeArr", includeArr)

	model[req.endpoint].findOne({
			include: includeArr,		
			where: req.query.condition
		}).then(function(row) {
			if (row) {
				res.status(200).send(row);
				return;
			}  else {
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
			if (rows) {
				res.status(201).send("Created");
				return
			} else {
				res.status(500).send("Unable to create");
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

// To update 

export function update(req, res) {
	if (req.body.id) {
		Reflect.deleteProperty(req.body, 'id');
	}

	req.body['last_updated_on'] = new Date();

	model[req.endpoint].update(req.body, {
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(function(rows) {
			if (rows) {
				res.status(200).send(rows);
				return
			}else {
				res.status(500).send("Unable to Update");
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

// For soft delete


export function softDelete(req, res) {
	if (req.body.id) {
		Reflect.deleteProperty(req.body, 'id');
	}
	model[req.endpoint].update({
			deleted: true
		}, {
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(function(rows) {
			if (rows) {
				res.status(200).send(rows);
				return
			}
			else {
				res.status(500).send("Unable to Delete");
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