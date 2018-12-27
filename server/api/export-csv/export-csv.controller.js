'use strict';

const mv = require('mv');
const _ = require('lodash');
const path = require('path');
const sequelize = require('sequelize');
const service = require('../service');
const config = require('../../config/environment');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const populate = require('../../utilities/populate')
const ReportService = require('../../utilities/reports');
const reportsService = require('../../api/reports/reports.service');
const orderService = require('../../api/order/order.service');
const moment = require('moment');
const model = require('../../sqldb/model-connect');
const async = require('async');
const Json2csvParser = require('json2csv').Parser;
const orderStatus = require('../../config/order_status');


// starts export csv Ad-revenue //
exports.exportcsv = function(req, res) {
	var adType = {
		"type1": "AD",
		"type2": "Featured Listing",
	};
	reportsService.adFeaturedRevenue(req, res)
		.then((response) => {
			for (let value of response.rows) {
				if (value.type == 1) {
					value.type = adType.type1;
				}
				else {
					value.type = adType.type2;
				}
				if (value.clicks != null && value.impression != null) {
					value.CTR = ((value.clicks / value.impression) * 100).toFixed(2) + "%";
				}
				else if ((value.clicks == null) && (value.impression == null)) {
					value.CTR = 0;
					value.impression = 0;
					value.clicks = 0
				}
				if (value.Payment != null) {
					value.CostToVendor = value.Payment.amount;
				}
				else {
					value.CostToVendor = 0;
				}
			}
			var fields = [];
			fields = _.map(response.rows.columns, 'columnName');
			fields.push('product_name', 'type', 'start_date', 'end_date', 'impression', 'clicks', 'CTR', 'CostToVendor');
			const opts = {
				fields
			};
			const parser = new Json2csvParser(opts);
			const csv = parser.parse(response.rows);
			res.write(csv);
			res.end();
			return;

		})
}
// ends export csv Ad-revenue //


// starts export csv personal-order-history//
exports.orderHistoryexportcsv = function(req, res) {

	if (req.body.id != 0) {
		var offset, limit, field, order;
		var queryObj = {};
		var ids = [];
		var type = [];
		let includeArr = [];
		offset = req.query.offset ? parseInt(req.query.offset) : null;
		delete req.query.offset;
		limit = req.query.limit ? parseInt(req.query.limit) : null;
		delete req.query.limit;
		field = req.query.field ? req.query.field : "id";
		delete req.query.field;
		order = req.query.order ? req.query.order : "asc";
		delete req.query.order;

		queryObj['id'] = JSON.parse("[" + req.body.id + "]");

		service.findAllRows('Order', includeArr, queryObj, 0, null, field, order)
			.then(function(rows) {
				for (let value of rows.rows) {
					if (value.id != '') {
						value.invoice = value.id;
						value.Date = value.ordered_date;
						value.Method = "Stripe";

						value.Amount = ((value.total_price) > 0) ? (parseFloat(value.total_price)).toFixed(2) : 0;

					}
					// if (value.order_status != '') {
					// 	Object.keys(orderStatus).forEach(function(key) {
					// 		if (value.order_status == orderStatus[key]) {
					// 			var val1 = key.toLowerCase();
					// 			var val = val1.charAt(0).toUpperCase() + val1.slice(1);
					// 			val = val.replace("order", " "); //Order
					// 			value.Status = val;
					// 		}
					// 	});
					// }
					if (value.status != '') {
						Object.keys(status).forEach(function(key) {
							if (value.status == status[key]) {
								var val1 = key.toLowerCase();
								var val = val1.charAt(0).toUpperCase() + val1.slice(1);
								//val = val.replace("order", " "); //Order
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
// ends export csv personal-order-history //


// starts export csv my-order-history//
exports.myOrderHistoryexportcsv = function(req, res) {

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
								//val = val.replace("order", " "); //Order
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
// ends export csv my-order-history//
//starts export csv sales-history//
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
								//val = val.replace("order", " "); //Order
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
//starts export csv report-performance//
exports.reportperformanceexportcsv = function(req, res) {
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var lhsBetween = [];
	var rhsBetween = [];
	var queryURI = {};

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 25;
	field = 'id';
	order = 'asc';

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("MM/DD/YYYY"), moment(req.query.lhs_to).format("MM/DD/YYYY"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("MM/DD/YYYY"), moment().format("MM/DD/YYYY"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("MM/DD/YYYY"), moment(req.query.rhs_to).format("MM/DD/YYYY"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("MM/DD/YYYY"), moment().format("MM/DD/YYYY"));
	}

	queryURI['offset'] = offset;
	queryURI['limit'] = limit;
	queryURI['lhs_from'] = lhsBetween[0];
	queryURI['lhs_to'] = lhsBetween[1];
	queryURI['rhs_from'] = rhsBetween[0];
	queryURI['rhs_to'] = rhsBetween[1];
	queryURI['compare'] = 'true';
	let performanceQueryObj = {};
	performanceQueryObj.vendor_id = req.body.vendor_id;

	if (req.query.compare) {
		performanceQueryObj.compare = req.query.compare;
		queryURI['compare'] = req.query.compare;
	}

	ReportService.exportperformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset).then(function(results) {
		var finalresults = [];
		for (let value of results.lhs_result) {
			value.total_sales = ((value.total_sales) > 0) ? (parseFloat(value.total_sales)).toFixed(2) : 0;
			value.vendor_fee = ((value.vendor_fee) > 0) ? (parseFloat(value.vendor_fee)).toFixed(2) : 0;
			value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			finalresults.push(value);
		}
		var fields = [];
		fields = _.map(finalresults, 'columnName');
		fields.push('product_name', 'marketplace_name', 'total_sales', 'vendor_fee', 'gtc_fees');
		const opts = {
			fields
		};
		const parser = new Json2csvParser(finalresults);
		const csv = parser.parse(finalresults);
		res.write(csv);
		res.end();
		return;
	}).catch((err) => {
		console.log('performance err', err);
		res.status(500).send("Internal server error");
		return
	});

};
// ends export csv report-performance//


//starts export csv top vendors
export function vendorPerformancecsv(req, res){
	var queryObj = {};
	var lhsBetween = [], rhsBetween = [];
	var limit, offset, compare;

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if(req.user.role == 1){
		if(req.query.compare){
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from)); 
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));	 
		}		
	}

	if(req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;

	if(req.query.compare){
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}

	if(req.query.lhs_from && req.query.lhs_to){
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	}else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
		ReportService.vendorPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
			var finalresults = [];
			for (let value of results.lhs_result) {
				value.total_fees = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
				value.vendor_fees = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
				value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
				finalresults.push(value);
			}
		var fields = [];
		fields = _.map(finalresults, 'columnName');
		fields.push('vendor_id','vendor_name', 'owner_name', 'type', 'sales', 'total_fees','vendor_fees','gtc_fees');
		const opts = {
			fields
		};
		const parser = new Json2csvParser(finalresults);
		const csv = parser.parse(finalresults);
		res.write(csv);
		res.end();
		return;
		}).catch((err) => {
		console.log('compareVendorPerformance err', err);
		return res.status(500).send(err);
	});
}
//ends export csv top vendors

//starts export csv top products
export function productPerformanceChangescsv(req, res){
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if(req.user.role == 1){
		if(req.query.compare){
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from)); 
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));	 
		}		
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.productPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
	var finalresults = [];
		for (let value of results.lhs_result) {
			value.total_fees = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
			value.vendor_fees = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			finalresults.push(value);
		}
	var fields = [];
	fields = _.map(finalresults, 'columnName');
	fields.push('product_name','marketplace_name', 'vendor_name','owner_name','type', 'sales', 'total_fees','vendor_fees','gtc_fees');
	const opts = {
		fields
	};
	const parser = new Json2csvParser(finalresults);
	const csv = parser.parse(finalresults);
	res.write(csv);
	res.end();
	return;
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}
//ends export csv top products

//starts export csv top selling categories
export function compareCategoryPerformancecsv(req, res){
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if(req.user.role == 1){
		if(req.query.compare){
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from)); 
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));	 
		}		
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.categoryPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		var finalresults = [];
		for (let value of results.lhs_result) {
			value.total_fees = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
			value.vendor_fees = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			finalresults.push(value);
		}
	var fields = [];
	fields = _.map(finalresults, 'columnName');
	fields.push('category_name', 'sales','total_fees','vendor_fees','gtc_fees');
	const opts = {
		fields
	};
	const parser = new Json2csvParser(finalresults);
	const csv = parser.parse(finalresults);
	res.write(csv);
	res.end();
	return;
		//return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}
//ends export csv top selling categories

//starts export top selling marketplace
export function compareMarketPlacePerformancecsv(req, res){
	var queryObj = {};
var lhsBetween = [];
var rhsBetween = [];
var limit, offset, compare;
offset = req.query.offset ? parseInt(req.query.offset) : 0;
limit = req.query.limit ? parseInt(req.query.limit) : 10;

if(req.user.role == 1){
	if(req.query.compare){
		req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
		req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
		req.query.rhs_from = new Date(parseInt(req.query.rhs_from)); 
		req.query.rhs_to = new Date(parseInt(req.query.rhs_to));	 
	}		
}

if (req.user.role == 2)
	queryObj.vendor_id = req.user.Vendor.id;
else
	queryObj.vendor_id = null;
if (req.query.compare) {
	queryObj.compare = req.query.compare ? req.query.compare : 'false';
}
if (req.query.lhs_from && req.query.lhs_to) {
	lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
} else {
	lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
}
if (req.query.rhs_from && req.query.rhs_to) {
	rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
} else {
	rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
}

ReportService.marketplacePerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {

	//return res.status(200).send(results);
	console.log("results:::"+JSON.stringify(results));
	var finalresults = [];
		for (let value of results.lhs_result) {
			value.total_fees = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
			value.vendor_fees = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			finalresults.push(value);
		}
	var fields = [];
	fields = _.map(finalresults, 'columnName');
	fields.push('marketplace_name', 'sales','total_fees','vendor_fees','gtc_fees');
	const opts = {
		fields
	};
	const parser = new Json2csvParser(finalresults);
	const csv = parser.parse(finalresults);
	res.write(csv);
	res.end();
	return;
}).catch((err) => {
	console.log('comparePerformance err', err);
	return res.status(500).send(err);
});
}
//ends export top selling marketplace

//starts export top selling city 
export function compareCityPerformancecsv(req, res){
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if(req.user.role == 1){
		if(req.query.compare){
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from)); 
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));	 
		}		
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.cityPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {

		//return res.status(200).send(results);
		console.log("results:::"+JSON.stringify(results));
		var finalresults = [];
		for (let value of results.lhs_result) {
			value.total_fees = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
			value.vendor_fees = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			finalresults.push(value);
		}
	   var fields = [];
	fields = _.map(finalresults, 'columnName');
	fields.push('total_fees', 'vendor_fees','sales','gtc_fees','Product.city');
	const opts = {
		fields
	};
	const parser = new Json2csvParser(finalresults);
	const csv = parser.parse(finalresults);
	res.write(csv);
	res.end();
	return;
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}
//ends export top selling city

//starts export top selling countries
export function compareCountriesPerformancecsv(req, res){
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if(req.user.role == 1){
		if(req.query.compare){
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from)); 
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));	 
		}		
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.countryPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
	   var finalresults = [];
		for (let value of results.lhs_result) {
			value.total_fees = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
			value.vendor_fees = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			finalresults.push(value);
		}
	   var fields = [];
	fields = _.map(finalresults, 'columnName');
	fields.push('total_fees', 'vendor_fees','sales','gtc_fees','Product.Country.name');
	const opts = {
		fields
	};
	const parser = new Json2csvParser(finalresults);
	const csv = parser.parse(finalresults);
	res.write(csv);
	res.end();
	return;
		//return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}
//ends export top selling countries

//starts export top top buyers
export function compareUserPerformancecsv(req, res){

	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if(req.user.role == 1){
		if(req.query.compare){
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from)); 
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));	 
		}		
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;

	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}

	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.userPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		console.log("resultss:::"+JSON.stringify(results));
        var finalresults = [];
		for (let value of results.lhs_result) {
			value.total_fees = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
			value.vendor_fees = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			finalresults.push(value);
		}
	   var fields = [];
	fields = _.map(finalresults, 'columnName');
	fields.push('total_fees', 'vendor_fees','sales','gtc_fees','Product.Country.name');
	const opts = {
		fields
	};
	const parser = new Json2csvParser(finalresults);
	const csv = parser.parse(finalresults);
	res.write(csv);
	res.end();
	return;
		
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});	
}
//ends export top buyers
