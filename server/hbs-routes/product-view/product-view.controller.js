'use strict';

const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');
const sequelize = require('sequelize');
const _ = require('lodash');


export function GetProductDetails(req, res) {
    var queryObj = {};
    var includeArr = [];
    var LoggedInUser = {};


    if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
        LoggedInUser = req.gtcGlobalUserObj;
    }

    if(req.params.product_id)
        queryObj['id'] = req.params.product_id;

    if(req.params.product_slug)
        queryObj['product_slug'] = req.params.product_slug;

        queryObj['status'] = status["ACTIVE"];

    includeArr = populate.populateData("Vendor,Marketplace,MarketplaceType,Category,SubCategory,Country,State")

    return model["Product"].findOne({
        where: queryObj,
        include: [
            { model: model["Vendor"] },
            { model: model["Marketplace"] },
            { model: model["MarketplaceType"] },
            { model: model["Category"] },
            { model: model["SubCategory"] },
            { model: model["Country"] },
            { model: model["State"] },
            { model: model["Review"]},
            {
                model: model["ProductMedia"], 
                where: {
                    status : {
                        '$eq': status["ACTIVE"]
                    }
                }
        }],
        order: [
            [ model["ProductMedia"], 'base_image', 'DESC'],
            [ model["Review"], 'created_on', 'DESC']
        ]
    }).then(function(product) {
            if (product) {


            var productsList = JSON.parse(JSON.stringify(product));

            let productReviewsList = _.groupBy(productsList.Reviews, "rating");
            

                res.render('product-view', {
                    title: "Global Trade Connect",
                    product: productsList,
                    productReviewsList: productReviewsList,
                    LoggedInUser: LoggedInUser
                });

            } else {
                res.render('product-view', {
                    title: "Global Trade Connect"
                });
            }
        })
        .catch(function(error) {
            console.log('Error:::', error);
            res.render('product-view', error);
        });
}


export function productView(req, res) {
    //old code

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
