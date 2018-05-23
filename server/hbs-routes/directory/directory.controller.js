'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');

export function directory(req, res) {
    var categoryModel = "Category";
    var subcategoryModel = "SubCategory";
    var countryModel = "Country";
	var offset, limit, field, order;
	var queryObj = {};

	offset = 0;
	limit = null;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];
	
    async.series({
        category: function (callback) {
            service.findRows(categoryModel, queryObj, offset, 10, field, order)
                .then(function (category) {
                    return callback(null, category.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        subCategory: function (callback) {
            service.findRows(subcategoryModel, queryObj, offset, limit, field, order)
                .then(function (subCategory) {
                    return callback(null, subCategory.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        country: function (callback) {
            service.findRows(countryModel, queryObj, offset, limit, "id", "asc")
                .then(function (country) {
                    return callback(null, country.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }
    }, function (err, results) {
        if (!err) {
             res.render('directory', {
				title: "Global Trade Connect",
				category: results.category,
                subCategory: results.subCategory,
                country: results.country
			});
        }
        else {
            res.render('directory', err);
        }
    });
}
