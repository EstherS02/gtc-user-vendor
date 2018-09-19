'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const Position = require('../../config/position');

export function adList(req,res){
	var LoggedInUser = {};
    var bottomCategory = {};
    var queryObj = {};
    var categoryModel = "Category";
    var countryModel = "Country";
    var adsModel = "ProductAdsSetting";
     if (req.user)
        LoggedInUser = req.user;
    var includeArrAds = [{
    	model:model['Country'],
    	include:[{
    		model:model['State']
    	}]
    }];
    let user_id = LoggedInUser.id;
    async.series({
        cartCounts: function(callback) {
            service.cartHeader(LoggedInUser).then(function(response) {
                return callback(null, response);
            }).catch(function(error) {
                console.log('Error :::', error);
                return callback(null);
            });
        },
        categories: function(callback) {
            var includeArr = [];
            const categoryOffset = 0;
            const categoryLimit = null;
            const categoryField = "id";
            const categoryOrder = "asc";
            const categoryQueryObj = {};

            categoryQueryObj['status'] = statusCode["ACTIVE"];

            service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
                .then(function(category) {
                    var categories = category.rows;
                    bottomCategory['left'] = categories.slice(0, 8);
                    bottomCategory['right'] = categories.slice(8, 16);
                    return callback(null, category.rows);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        ads: function(callback) {
			service.findAllRows(adsModel,includeArrAds , {}, 0, 15, 'created_on', 'desc')
                .then(function(response) {
                    return callback(null, response);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
		},
    }, function(err, results) {
        if (!err) {
            res.render('vendorNav/advertisement/ad-list', {
                title: "Global Trade Connect",
                LoggedInUser: LoggedInUser,
                categories: results.categories,
                ads:results.ads,
                statusCode:statusCode,
                bottomCategory: bottomCategory,
                cartheader: results.cartCounts,
                selectedPage: 'ad-form',
                vendorPlan: vendorPlan,
            });
        } else {
            res.render('vendorNav/ad-form', err);
        }
    });
}

export function adForm(req, res) {
	 var LoggedInUser = {};
    var bottomCategory = {};
    var queryObj = {};
    var categoryModel = "Category";
    var countryModel = "Country";
     if (req.user)
        LoggedInUser = req.user;
    let user_id = LoggedInUser.id;
    async.series({
        cartCounts: function(callback) {
            service.cartHeader(LoggedInUser).then(function(response) {
                return callback(null, response);
            }).catch(function(error) {
                console.log('Error :::', error);
                return callback(null);
            });
        },
        categories: function(callback) {
            var includeArr = [];
            const categoryOffset = 0;
            const categoryLimit = null;
            const categoryField = "id";
            const categoryOrder = "asc";
            const categoryQueryObj = {};

            categoryQueryObj['status'] = statusCode["ACTIVE"];

            service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
                .then(function(category) {
                    var categories = category.rows;
                    bottomCategory['left'] = categories.slice(0, 8);
                    bottomCategory['right'] = categories.slice(8, 16);
                    return callback(null, category.rows);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        country: function(callback) {
			const countryField = 'name';
			const countryOrder = 'ASC';
			service.findRows(countryModel, queryObj, 0, null, countryField, countryOrder)
				.then(function(country) {
					return callback(null, country.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},

    }, function(err, results) {
        if (!err) {
            res.render('vendorNav/advertisement/ad-form', {
                title: "Global Trade Connect",
                LoggedInUser: LoggedInUser,
                categories: results.categories,
                bottomCategory: bottomCategory,
                cartheader: results.cartCounts,
				country: results.country,
                selectedPage: 'ad-form',
                Position:Position,
                vendorPlan: vendorPlan,
            });
        } else {
            res.render('vendorNav/ad-form', err);
        }
    });
}