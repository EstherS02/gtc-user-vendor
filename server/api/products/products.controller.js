'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');

export function productDec(req, res) {

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
						.then(() => {
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