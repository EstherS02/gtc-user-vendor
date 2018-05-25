'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');


export function editListing(req, res){
    var productModel = "ProductSalesRating";
    if(req.query.id){
        console.log("req.query.id",req.query.id);
    }

    service.findRow(productModel,req.query.id)
        .then(function (product) {
            res.render('edit-listing', {
                title: 'Global Trade Connect',
                product : plainTextResponse(product)
            });
        }).catch(function (error) {
            console.log('Error :::', error);
            res.render('edit-listing', error)
        });

}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}
 
