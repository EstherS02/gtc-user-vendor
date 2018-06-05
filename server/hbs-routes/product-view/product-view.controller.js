'use strict';

const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');


export function productView(req, res) {

    let searchObj = {}

    if (req.params.product_id)
        searchObj["id"] = req.params.product_id;

    if (req.params.product_slug)
        searchObj["product_slug"] = req.params.product_slug;

    service.findOneRow('Product', searchObj)
        .then(function(productDetails) {
            res.render('productView', {
                title: 'Global Trade Connect',
                productDetails: productDetails
            });
        }).catch(function(error) {
            console.log('Error :::', error);
            res.render('productView', error)
        });
}

export function GetProductDetails(req, res) {
    var modeName = "Product";
    var queryObj = {};
    var includeArr = [];

    queryObj['product_slug'] = req.params.productSlugName;
    queryObj['status'] = status["ACTIVE"];

    includeArr = populate.populateData("Marketplace,MarketplaceType,Category,SubCategory,Country,State")

    service.findOneRow(modeName, queryObj, includeArr)
        .then(function(product) {
            if (product) {
                res.render('product-view', {
                    title: "Global Trade Connect",
                    product: product
                });
            } else {
                res.render('product-view', {
                    title: "Global Trade Connect"
                });
            }
        })
        .catch(function(error) {
            console.log('Error:::', error);
            res.render('product-view', err);
        });
}
