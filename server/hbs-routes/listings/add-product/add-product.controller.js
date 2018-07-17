'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const populate = require('../../../utilities/populate');
const vendorPlan = require('../../../config/gtc-plan');
var url = require('url');


export function addProduct(req, res) {

    var categoryModel = "Category";
    var countryModel = "Country";
    var marketplaceTypeModel = "MarketplaceType";

    var offset, limit, field, order;
    var queryObj = {},  LoggedInUser = {};

    var type=req.params.type;

    offset = 0;
    limit = null;
    field = "id";
    order = "asc";

    var LoggedInUser = {};

    if(req.user)
    LoggedInUser = req.user;
    

    queryObj['status'] = status["ACTIVE"];

    async.series({
        category: function (callback) {
            service.findRows(categoryModel, queryObj, offset, limit, field, order)
                .then(function (category) {
                    return callback(null, category.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        country: function (callback) {
            service.findRows(countryModel, queryObj, offset, limit, field, order)
                .then(function (country) {
                    return callback(null, country.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        marketplaceType: function (callback) {
            service.findRows(marketplaceTypeModel, queryObj, offset, limit, field, order)
                .then(function (marketplaceType) {
                    return callback(null, marketplaceType.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }
    }, function (err, results) {
		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url,'').replace(req.protocol + '://' + req.get('host'),'').replace('/','');
        if (!err) {
            res.render('vendorNav/listings/add-product', {
                title: "Global Trade Connect",
                category: results.category,
                country: results.country,
                marketplaceType:results.marketplaceType,
                LoggedInUser: LoggedInUser,
                vendorPlan:vendorPlan,
				type:type,
				dropDownUrl:dropDownUrl,
            });
        }
        else {
            res.render('vendorNav/listings/add-product', err);
        }
    });
}