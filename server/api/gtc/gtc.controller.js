'use strict';

import sequelizeDB from '../../sqldb';
import test from '../../models/index';
import config from '../../config/environment';

var model = test.init(sequelizeDB);

export function index(req, res) {
	console.log('req.params', req.params.entity_end_point);
	console.log("CHECKING CONFIG VARIABLES", config);
	model['Mark'].findOne({
		raw: true,
		include: [{ all: true }]
	}).then(row => {
		res.send(200, row);
		return;
	});
}