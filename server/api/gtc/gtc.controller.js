'use strict';

import sequelizeDB from '../../sqldb';
import test from '../../models/index';
import config from '../../config/environment';

var model = test.init(sequelizeDB);

var sendRsp = require('../../utils/response').sendRsp;

function respondWithResult(res, statusCode, method ) {	
	statusCode = statusCode || 200;
	return function(entity) {
		if (entity && statusCode == 201 && method == 'POST') {
			sendRsp(res, statusCode, 'Created', entity);
			return null;
		} else if (entity && statusCode == 200 && method == 'GET') {
			sendRsp(res, statusCode, 'Ok', entity);
			return null;
		} else if (entity && statusCode == 200 && method == 'PUT') {
			if (entity[0] > 0) {
				sendRsp(res, statusCode, 'Updated', entity[1][0]);
				return null;
			} else {
				sendRsp(res, 404, 'Entity Not Found');
				return null;
			}
		}
		return null;
	};
}

function handleEntityNotFound(res) {
	return function(entity) {
		if (!entity) {
			sendRsp(res, 404, 'Not Found');
			return null;
		}
		return entity;
	};
}

function handleError(res, statusCode) {
	statusCode = statusCode || 500;
	return function(err) {
		sendRsp(res, 500, 'Server Error', err);
		return null;
	};
}

function respondWithDeleteResult(res, statusCode) {
	return function(entity) {
		if (entity) {
			sendRsp(res, 200, 'Deleted');
			return null;
		}
		return null;
	};
}

function removeEntity(res) {	
	return function(entity) {
		if (entity) {
			return entity.destroy()
				.then(() => {
					sendRsp(res, 200, 'Deleted');
					return null;
				});
		}
	};
}

export function index(req, res) {

	console.log("req.entityEndPoint")

	     model[req.entityEndPoint].findAndCountAll({})
		.then(respondWithResult(res, 200, req.method))
		.catch(handleError(res));
}

export function findOne(req, res) {
	model[req.entityEndPoint].findOne({
			where: {
				id: req.params.id
			}
		}).then(handleEntityNotFound(res))
		.then(respondWithResult(res, 200, req.method))
		.catch(handleError(res));
}

export function create(req, res) {

	console.log("Comming to create",req.entityEndPoint);

	req.body['created_on'] = new Date();
	
	
       	model[req.entityEndPoint].create(req.body)
		.then(respondWithResult(res, 201, req.method))
		.catch(handleError(res));
}

export function destroy(req, res) {

	req.body['deleted_at'] = new Date();

	model[req.entityEndPoint].find({
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(handleEntityNotFound(res))
		.then(removeEntity(res))
		.catch(handleError(res));
}

export function update(req, res) {
	if (req.body.id) {
		Reflect.deleteProperty(req.body, 'id');
	}

	req.body['last_updated_on'] = new Date();

    model[req.entityEndPoint].update(req.body, {
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(respondWithResult(res, 200, req.method))
		.catch(handleError(res));
}

export function softDelete(req, res) {
	if (req.body.id) {
		Reflect.deleteProperty(req.body, 'id');
	}
	  model[req.entityEndPoint].update({
			deleted: true
		},{
			where: {
				id: req.params.id
			},
			individualHooks: true
		})
		.then(respondWithDeleteResult(res, 200))
		.catch(handleError(res));
}




