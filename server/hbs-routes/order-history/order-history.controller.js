'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const marketPlace = require('../../config/marketplace');
import series from 'async/series';
var async = require('async');

export function orderHistory(req, res) {
	var LoggedInUser = {};
	// console.log(req.user.Vendor.id)
	if (req.user)
		LoggedInUser = req.user;
	var orderItemQueryObj = {};
	var orderQueryObj = {};
	var productQueryObj = {};

	//  Query string assignment
	var from_date = req.query.from_date;
	var to_date = req.query.to_date;
	var dateSelect = req.query.dateSelect;
	var marketType = req.query.marketType;
	var status = req.query.status;
	var start_date;
	var end_date;
	if(dateSelect){
		 	end_date= moment();
		if(dateSelect == "today"){
			start_date =  moment();
        }else if(dateSelect == "yesterday"){
			start_date= moment().add(-1,'d').toDate();
        }else if(dateSelect == "last7day"){
			start_date= moment().add(-7,'d').toDate();
        }else if(dateSelect == "last15day"){
			start_date= moment().add(-15,'d').toDate();	
        }else if(dateSelect == "last30day"){
			start_date= moment().add(-30,'d').toDate();	
        }else {
        	if(from_date){
				start_date= from_date;
        	}else{
        		start_date= moment().add(-7,'d').toDate();
        	}
        	if(to_date){
				end_date= to_date;
        	}
        }
	        orderQueryObj['from']= {
	        $between: [start_date, end_date]
	    };

	}else {
        	if(from_date){
				start_date= from_date;
        	}else{
        		start_date= moment().add(-7,'d').toDate();
        	}
        	if(to_date){
				end_date= to_date;
        	}else{
        		end_date= moment();
        	}
        	orderQueryObj['ordered_date']= {
		        $between: [start_date, end_date]
		    };
        }
        if(marketType){
        	productQueryObj['marketplace_id'] = marketType;
        }
        if(status){
        	orderQueryObj['status'] = status;
        }
	
	// end Query string assignment




	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	// var vendor_id = req.user.Vendor.id;
	
	

	let user_id = LoggedInUser.id;


	//pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 20;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;
	var field = "id";
	offset = (page - 1) * limit;
	var maxSize;
	// End pagination

	var modelName = "OrderItem";
	orderQueryObj['user_id'] = 30;
	var includeArr = [{
		model: model["Order"],
		where:orderQueryObj,
		attributes:['id','invoice_id','delivered_on','ordered_date','total_price'],
		// [sequelize.fn('SUM', sequelize.col('Orders.total_price')), 'total_trans']
		// [sequelize.fn('SUM', sequelize.col('Orders.total_price')), 'total_trans'],

		where: orderItemQueryObj
	}, {
			model: model['Product'],
			where:productQueryObj,
			include: [{
				model: model['Vendor'],
			}]
			
	}];
	console.log(orderQueryObj);

	async.series({
			orderHistory: function(callback) {
				service.findRows(modelName, orderItemQueryObj, offset, limit, field, order, includeArr)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			}
		},
		function(err, results) {
			if (!err) {
				// console.log(results.orderHistory.rows);
				res.render('order-history', {
					title: "Global Trade Connect",
					OrderItems: results.orderHistory.rows,
					count: results.orderHistory.count,
					LoggedInUser: LoggedInUser,
					marketPlace: marketPlace
				});
			} else {
				res.render('order-history', err);
			}
		});
	
}