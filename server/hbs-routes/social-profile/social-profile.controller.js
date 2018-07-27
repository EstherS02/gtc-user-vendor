'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function socialProfile(req, res) {
    var LoggedInUser = {};
    var bottomCategory ={};
   
    var vendorModel = "Vendor";

    if(req.user)
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
        vendorInfo: function (callback) {
            var id = LoggedInUser.Vendor.id;
            service.findIdRow(vendorModel,id )
                .then(function (vendorInfo) {

                    return callback(null, vendorInfo);

                }).catch(function (error) {
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
            var categoryModel = "Category";
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

        }
    }, function (err, results) {
        if (!err) {
            res.render('vendorNav/social-profile', {
				title: "Global Trade Connect",
                vendorInfo:results.vendorInfo,
                categories: results.categories,
                bottomCategory: bottomCategory,
                LoggedInUser: LoggedInUser,
                cartheader: results.cartCounts,
                selectedPage:'social-profile',
                vendorPlan:vendorPlan
			});
        }
        else {
            res.render('vendorNav/social-profile', err);
        }
    });

}