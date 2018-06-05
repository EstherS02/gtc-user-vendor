'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');


export function productView(req, res) {

    console.log(req['headers'])

    let searchObj = {}

    if(req.params.product_id)
        searchObj["id"] = req.params.product_id;

    if(req.params.product_slug)
        searchObj["product_slug"] = req.params.product_slug;    

    service.findOneRow('Product', searchObj)
        .then(function (productDetails) {
            console.log(productDetails)
            res.render('productView', {
                title: 'Global Trade Connect',
                productDetails : productDetails
            });
        }).catch(function (error) {
            console.log('Error :::', error);
            res.render('productView', error)
        });
}

