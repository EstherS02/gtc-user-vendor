'use strict';

import sequelizeDB from '../../sqldb';
import test from '../../models/index';
import config from '../../config/environment';

var model = test.init(sequelizeDB);

export function index(req, res) {
	model['Mark'].findOne({
		include: [{
			all: true,
			nested: true
		}],
		raw: true
	}).then(row => {
		console.log('row', row);
		res.send(200, row);
		return;
	});
}