'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const productService = require('../../api/product/product.service');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function upgradeplan(req, res) {
	var LoggedInUser = {};
	var bottomCategory={};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	console.log("userid:::&&&&&"+LoggedInUser.Vendor.id);
	var queryPaginationObj = {};
	if (req.query.sort == 'rating') {
		var field = req.query.sort;
		queryPaginationObj["field"] = field;
	} else {
		var field = 'id';
		queryPaginationObj["field"] = field;
	}

	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	var vendor_id = LoggedInUser.Vendor.id;
	var rating_limit = 120;
	var queryObj = {};
	queryObj = {
		vendor_id: vendor_id,
	};

	//pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 5;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";

	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;
    // End pagination
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var dropDownUrl = fullUrl.replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
	   
	async.series({
		cartCounts: function(callback) {
			service.cartHeader(LoggedInUser).then(function(response) {
				return callback(null, response);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		cards: function (callback) {
            var includeArr = [];
            const offset = 0;
            const limit = null;
            const field = "id";
            const order = "asc";
           
            service.findAllRows("PaymentSetting", includeArr, user_id, offset, limit, field, order)
                .then(function(paymentSetting) {
                    var paymentSettings = paymentSetting.rows;
                    return callback(null, paymentSettings);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
		},
		userplanDetails: function(callback)
		{
			var includeArr = [];
            
			var queryObjs ={};
			queryObjs = {
				user_id: user_id
				
			};
					
			service.findRow("UserPlan", queryObjs, includeArr)
                .then(function(userplanDetails) {
					var userplanDetails = userplanDetails;
					return callback(null, userplanDetails);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
		},

		planDetails: function(callback)
		{
			
			productService.planDetails(vendor_id)
				.then((response) => {
					
					return callback(null, response);
				}).catch((error) => {
					console.log('Error :::', error);
					return callback(null);
				});
		}


	}, function(err, results) {
		console.log("resultsss::"+results.userplanDetails.status);
		 if (!err) {
			res.render('vendorNav/upgradeplan', {
				title: "Global Trade Connect",
				userplanDetails:results.userplanDetails.status,
				PlanDetails: results.planDetails,
				cartheader:results.cartCounts,
				carddetails:results.cards,
				LoggedInUser: LoggedInUser,
				selectedPage: 'upgradeplan'
				
			});
		} else {
			res.render('upgradeplan', err);
		}
	});
		

}