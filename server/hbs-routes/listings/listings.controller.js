'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
import series from 'async/series';


export function listings(req, res) {

    var queryParams = {};

    var field = "id";
	var order = "desc";

    queryParams["vendor_name"] = 'devan vendor';
    queryParams['status'] = {
        '$ne': status["DELETED"]
    }

    async.series({
		products: function (callback) {

			service.findRows('ProductSalesRating', queryParams , 0, 15, field, order)
				.then(function (products) {

					return callback(null, products.rows);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
    }, function (err, results) {
		if (!err) {
			res.render('edit-listings', results);
		}
		else {
			res.render('edit-listings', err);
		}
	});

}














	// res.render('edit-listings', {
    //     title: 'Global Trade Connect'
    // });

