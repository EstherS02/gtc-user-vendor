'use strict';

const _ = require('lodash');
const service = require('../service');
const status = require('../../config/status');
const ReportService = require('../../utilities/reports');
const reportsService = require('../../api/reports/reports.service');
const orderService = require('../../api/order/order.service');
const moment = require('moment');
const model = require('../../sqldb/model-connect');
const async = require('async');
const Json2csvParser = require('json2csv').Parser;

exports.exportcsv = function(req, res) {
	var adType = {
		"type1": "AD",
		"type2": "Featured Listing",
	};
	reportsService.adFeaturedRevenue(req, res)
		.then((response) => {
			var finalresults = [];
			for (let value of response.rows) {
				var result = {};
				result.ad_or_listing_name = value.product_name;
				if (value.type == 1) {
					result.type = adType.type1;
					switch (value.position) {
						case 1:
							result.position = ' Directory Landing';
							break;
						case 2:
							result.position = ' Wholesale Landing';
							break;
						case 3:
							result.position = ' Shop Landing';
							break;
						case 4: 
							result.position = ' Service Landing';
							break;
						case 5:
							result.position = ' Lifestyle Landing';
							break;
						case 6:
							result.position = ' Product Landing';
							break;
						default:
							result.position = '-';
							break;
					}
				}else {
					result.type = adType.type2;
					var adPosition = '';
					
					if(value.position_homepage)
						adPosition =  'Home Page,';
					if(value.position_searchresult)
						adPosition = adPosition + ' Search Result,';
					if(value.position_profilepage)
						adPosition =  ' Profile Square,';
					if(value.position_wholesale_landing)
						adPosition =  adPosition +' Wholesale Landing,';
					if(value.position_shop_landing)
						adPosition =  adPosition +' Shop Landing,';
					if(value.position_service_landing)
						adPosition =  adPosition +' Service Landing,';
					if(value.position_subscription_landing)
						adPosition =  adPosition +' Lifestyle Landing';	
						
					result.position = adPosition;
				}
				result.start_date = moment(value.start_date).format("MMM D, Y");
				if(value.feature_indefinitely)
					result.end_date = 'Indefinite';
				else
					result.end_date = moment(value.end_date).format("MMM D, Y"); 
				if(value.impression)
					result.impression = value.impression;
				else
					result.impression = 0;
				if(value.clicks)
					result.clicks = value.clicks;
				else
					result.clicks = 0;
				if(value.impression && value.clicks)
					result.ctr = ((this.clicks/this.impression)*100);
				else
					result.ctr = 0;
				if (value.Payment) 
					result.cost_to_vendor = value.Payment.amount;
				else 
					result.cost_to_vendor = 0;
				
				finalresults.push(result);	
			}
			const parser = new Json2csvParser(finalresults);
			const csv = parser.parse(finalresults);
			res.write(csv);
			res.end();
			return;		
		})
}

exports.orderHistoryexportcsv = function(req, res) {

	var offset, limit, field, order;
	var queryObj = {};
	var ids = [];
	var type = [];
	let includeArr = [];
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "created_on";
	delete req.query.field;
	order = req.query.order ? req.query.order : "DESC";
	delete req.query.order;

	queryObj['user_id'] = req.user.id;

	service.findAllRows('Order', includeArr, queryObj, offset, limit, field, order)
		.then(function(rows) {
			var finalresults = [];
			for (let value of rows.rows) {

				var result = {};
				result.order_id = value.id;
				result.date = moment(value.ordered_date).format("MMM D, Y")
				result.method = 'Stripe';
				if (value.status) {
					Object.keys(status).forEach(function(key) {
						if (value.status == status[key]) {
							var val1 = key.toLowerCase();
							var val = val1.charAt(0).toUpperCase() + val1.slice(1);
							val = val.replace("order", " ");
							result.status = val;
						}
					});
				}
				result.Amount = ((value.total_price) > 0) ? (parseFloat(value.total_price)).toFixed(2) : 0;
				finalresults.push(result);	
			}
			const parser = new Json2csvParser(finalresults);
			const csv = parser.parse(finalresults);
			res.write(csv);
			res.end();
			return;
			
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
};

exports.myOrderHistoryexportcsv = function(req, res) {
		var offset = 0;
		var queryParams = {};
		var queryObj = {};
		var order = "DESC";
		var includeArray = [];
		var field = "created_on";
		var orderVendorModelName = "OrderVendor";
		var limit = req.query.limit ? parseInt(req.query.limit) : null;
		var offset = req.query.offset ? parseInt(req.query.offset) : 0;

		queryObj['vendor_id'] = req.user.Vendor.id;

		includeArray = [{
			model: model["Order"],
			attributes: ['id', 'ordered_date', 'status']
		}];

		orderService.findAllOrders(orderVendorModelName, includeArray, queryObj, offset, limit, field, order)
			.then(function(response) {

				var finalresults = [];
				for (let value of response.rows) {

					var result = {};

					result.order_id = value.order_id;
					result.date = moment(value.Order.ordered_date).format("MMM D, Y");
					result.method = 'Stripe';
					if (value.Order.status) {
						Object.keys(status).forEach(function(key) {
							if (value.Order.status == status[key]) {
								var val1 = key.toLowerCase();
								var val = val1.charAt(0).toUpperCase() + val1.slice(1);
								result.status = val;
							}
						});
					}
					result.amount = ((value.total_price) > 0) ? (parseFloat(value.total_price)).toFixed(2) : 0;		
					finalresults.push(result);		
				}
				const parser = new Json2csvParser(finalresults);
				const csv = parser.parse(finalresults);
				res.write(csv);
				res.end();
				return;
				
			}).catch(function(error) {
				console.log('Error :::', error);
				res.status(500).send("Internal server error");
				return
			});
};	

exports.salesHistoryexportcsv = function(req, res) {

	if (req.body.id != 0) {
		var offset, limit, field, order;
		var offset = 0;
		var queryParams = {};
		var queryObj = {};
		var order = "DESC";
		var includeArray = [];
		var field = "created_on";
		var orderVendorModelName = "OrderVendor";
		var limit = req.query.limit ? parseInt(req.query.limit) : 10;
		var offset = req.query.offset ? parseInt(req.query.offset) : 0;
		var page = req.query.page ? parseInt(req.query.page) : 1;

		queryParams['page'] = page;
		queryParams['limit'] = limit;
		offset = (page - 1) * limit;

		includeArray = [{
			model: model["Order"],
			attributes: ['id', 'ordered_date', 'status']
		}];

		queryObj['id'] = JSON.parse("[" + req.body.id + "]");

		orderService.findAllOrders(orderVendorModelName, includeArray, queryObj, offset, limit, field, order)
			.then(function(rows) {
				for (let value of rows.rows) {
					if (value.id != '') {
						value.invoice = value.id;
						value.Date = value.created_on;
						value.Method = "Stripe";

						value.Amount = ((value.total_price) > 0) ? (parseFloat(value.total_price)).toFixed(2) : 0;

					}
					if (value.status != '') {
						Object.keys(status).forEach(function(key) {
							if (value.status == status[key]) {
								var val1 = key.toLowerCase();
								var val = val1.charAt(0).toUpperCase() + val1.slice(1);
								value.Status = val;
							}
						});
					}
				}
				var fields = [];
				fields = _.map(rows.rows.columns, 'columnName');
				fields.push('invoice', 'Date', 'Method', 'Status', 'Amount');
				const opts = {
					fields
				};
				const parser = new Json2csvParser(opts);
				const csv = parser.parse(rows.rows);
				res.write(csv);
				res.end();
				return;
			}).catch(function(error) {
				console.log('Error :::', error);
				res.status(500).send("Internal server error");
				return
			});
	}
};

// export function vendorPerformancecsv(req, res) {
// 	var queryObj = {};
// 	var lhsBetween = [], rhsBetween = [];
// 	var limit, offset, compare;

// 	offset = req.query.offset ? parseInt(req.query.offset) : 0;
// 	limit = req.query.limit ? parseInt(req.query.limit) : 10;

// 	if (req.user.role == 1) {
// 		if (req.query.compare) {
// 			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
// 			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
// 			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
// 			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
// 		}
// 	}

// 	if (req.user.role == 2)
// 		queryObj.vendor_id = req.user.Vendor.id;
// 	else
// 		queryObj.vendor_id = null;

// 	if (req.query.compare) {
// 		queryObj.compare = req.query.compare ? req.query.compare : 'false';
// 	}

// 	if (req.query.lhs_from && req.query.lhs_to) {
// 		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
// 	} else {
// 		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
// 	}

// 	if (req.query.rhs_from && req.query.rhs_to) {
// 		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
// 	} else {
// 		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
// 	}
// 	ReportService.vendorPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
// 		var finalresults = [];
// 		for (let value of results.lhs_result) {

// 			var result = {};
// 			result.vendor_name = value.vendor_name;
// 			result.owner_name = value.owner_name;
// 			switch (value.type) {
// 				case 1:
// 					result.type = 'Starter Seller';
// 					break;
// 				case 2:
// 					result.type = 'Service Provider';
// 					break;
// 				case 3:
// 					result.type = 'Lifestyle Provider';
// 					break;
// 				case 4:
// 					result.type = 'Retailer';
// 					break;
// 				case 6:
// 					result.type = 'Wholesaler';
// 					break;
// 				default:
// 					result.type = '-';
// 					break;
// 			}
// 			result.sales = value.sales;
// 			result.revenue = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
// 			result.vendor_pay = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
// 			result.gtc_revenue = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;

// 			finalresults.push(result);
// 		}
// 		const parser = new Json2csvParser(finalresults);
// 		const csv = parser.parse(finalresults);
// 		res.write(csv);
// 		res.end();
// 		return;
// 	}).catch((err) => {
// 		console.log('compareVendorPerformance err', err);
// 		return res.status(500).send(err);
// 	});
// }

export function productPerformanceChangescsv(req, res) {
	var offset, limit, field, order;
	var queryParams = {};
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var lhsBetween = [];
	var rhsBetween = [];
	var queryURI = {};
	var selectedMetrics;
	const dateRangeOptions = [{
			"column": "Today",
			"value": 1
		}, {
			"column": "Yesterday",
			"value": 2
		}, {
			"column": "Last 7 Days",
			"value": 3
		}, {
			"column": "Last 30 Days",
			"value": 4
		}, {
			"column": "This Month",
			"value": 5
		}, {
			"column": "Last Month",
			"value": 6
		}
	];

	selectedMetrics = req.query.top ? req.query.top : "products";
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	field = 'id';
	order = 'asc';

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).toISOString(), moment(req.query.lhs_to).toISOString());
		queryURI['range'] = 7;
	}else{
		lhsBetween.push(moment().subtract(30, 'days').toISOString(), moment().toISOString());
		queryURI['range'] = 4;
	}

	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).toISOString(), moment(req.query.rhs_to).toISOString());
		queryURI['rhs_from'] = moment(rhsBetween[0]).format("MM/DD/YYYY");
		queryURI['rhs_to'] = moment(rhsBetween[1]).format("MM/DD/YYYY");
	}
	
	if (req.query.range) {
		queryURI['range'] = req.query.range;
	}
	
	queryURI['offset'] = offset;
	queryURI['limit'] = limit;
	queryURI['lhs_from'] = moment(lhsBetween[0]).format("MM/DD/YYYY");
	queryURI['lhs_to'] = moment(lhsBetween[1]).format("MM/DD/YYYY");
	queryURI['top'] = selectedMetrics;

	let performanceQueryObj = {};
			if (req.user.role == 2)
				performanceQueryObj.vendor_id = req.user.Vendor.id;

			if(req.query.compare == 'true'){
				performanceQueryObj.compare = req.query.compare;
				queryURI['compare'] = req.query.compare;
			}
			
			if (req.query.top == "marketplaces") {
				ReportService.marketplacePerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
					var fields = [];
				    fields = _.map(results.lhs_result.columns, 'columnName');
				    fields.push('marketplace_name','sales','total_fees','gtc_fees','vendor_fees');
				    const opts = {
					   fields
			     	};
				    const parser = new Json2csvParser(opts);
				    const csv = parser.parse(results.lhs_result);
				    res.write(csv);
				    res.end();
				    return;
				    }).catch(function(error) {
					 console.log('Error :::', error);
					 res.status(500).send("Internal server error");
					 return
					});
			     } else if (req.query.top == "countries") {
				  ReportService.countryPerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
					var fields = [];
				    fields = _.map(results.lhs_result.columns, 'columnName');
				    fields.push('Product.Country.name','sales','total_fees','gtc_fees','vendor_fees');
				    const opts = {
					   fields
			     	};
				    const parser = new Json2csvParser(opts);
				    const csv = parser.parse(results.lhs_result);
				    res.write(csv);
				    res.end();
				    return;

					}).catch(function(error) {
						//return callback(error);
						console.log('Error :::', error);
					 res.status(500).send("Internal server error");
					 return
					});
			} else if (req.query.top == "cities") {
				ReportService.cityPerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						//return callback(null, results);
					var fields = [];
				    fields = _.map(results.lhs_result.columns, 'columnName');
				    fields.push('Product.city','sales', 'total_fees','gtc_fees','vendor_fees');
				    const opts = {
					   fields
			     	};
				    const parser = new Json2csvParser(opts);
				    const csv = parser.parse(results.lhs_result);
				    res.write(csv);
				    res.end();
				    return;
					}).catch(function(error) {
						//return callback(error);
						console.log('Error :::', error);
					 res.status(500).send("Internal server error");
					 return
					});
			} else if (req.query.top == "buyers") {
				ReportService.userPerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
                 	var fields = [];
				    fields = _.map(results.lhs_result.columns, 'columnName');
				    fields.push('Order.User.first_name','sales','total_fees','gtc_fees', 'vendor_fees');
				    const opts = {
					   fields
			     	};
				    const parser = new Json2csvParser(opts);
				    const csv = parser.parse(results.lhs_result);
				    res.write(csv);
				    res.end();
				    return;
					}).catch(function(error) {
					console.log('Error :::', error);
					 res.status(500).send("Internal server error");
					 return

					});
			} 
			else {
				ReportService.productPerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
					var fields = [];
				    fields = _.map(results.lhs_result.columns, 'columnName');
				    fields.push( 'product_name','marketplace_name','sales','total_fees','gtc_fees','vendor_fees');
				    const opts = {
					   fields
			     	};
				    const parser = new Json2csvParser(opts);
				    const csv = parser.parse(results.lhs_result);
				    res.write(csv);
				    res.end();
				    return;
					}).catch(function(error) {
						//return callback(error);
						console.log('Error :::', error);
						res.status(500).send("Internal server error");
						return
					});
	}
	
}



