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

export function vendorPerformancecsv(req, res) {
	var queryObj = {};
	var lhsBetween = [], rhsBetween = [];
	var limit, offset, compare;

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
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
	ReportService.vendorPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		var finalresults = [];
		for (let value of results.lhs_result) {
			value.total_fees = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
			value.vendor_fees = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			delete value.vendor_id;
			finalresults.push(value);
		}
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

export function productPerformanceChangescsv(req, res) {

	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare, vendorId;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2){
		queryObj.vendor_id = req.user.Vendor.id;
		vendorId = req.user.Vendor.id;
	}
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

			var result = {};

			result.product = value.product_name;
			result.type = value.marketplace_name;
			result.sales = value.sales;
			result.revenue = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;

			if(vendorId){
				result.gtc_processing_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
				result.vendor_revenue = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			}else{
				result.vendor = value.vendor_name
				result.vendor_pay = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
				result.gtc_revenue = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			}

			finalresults.push(result);
		}

		/*var fields = [];
		fields = _.map(finalresults, 'columnName');
		fields.push('product_name', 'marketplace_name', 'vendor_name', 'sales', 'total_fees', 'vendor_fees', 'gtc_fees');
		const opts = {
			fields
		};*/

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

export function compareCategoryPerformancecsv(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
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
			delete value.category_id;
			finalresults.push(value);
		}		
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

export function compareMarketPlacePerformancecsv(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare, vendorId;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2){
		queryObj.vendor_id = req.user.Vendor.id;
		vendorId = req.user.Vendor.id;
	}else
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

		var finalresults = [];
		for (let value of results.lhs_result) {

			var result = {};

			result.marketplace = value.marketplace_name;
			result.sales = value.sales;
			result.revenue = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
			
			if(vendorId){
				result.gtc_processing_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
				result.vendor_revenue = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			}else{
				result.vendor_pay = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
				result.gtc_revenue = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			}

			finalresults.push(result);
		}
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

export function compareCityPerformancecsv(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare, vendorId;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2){
		queryObj.vendor_id = req.user.Vendor.id;
		vendorId = req.user.Vendor.id;
	}else
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
		var finalresults = [];
		for (let value of results.lhs_result) {

			var result = {};
			result.city = value['Product.city'];

			result.sales = value.sales;
			result.revenue = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;

			if(vendorId){
				result.gtc_processing_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
				result.vendor_revenue = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			}else{
				result.vendor_pay = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
				result.gtc_revenue = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			}
			
			finalresults.push(result);
		}
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

export function compareCountriesPerformancecsv(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare, vendorId;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2){
		queryObj.vendor_id = req.user.Vendor.id;
		vendorId = req.user.Vendor.id;
	}else
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

			var result = {};
			result.country = value['Product.Country.name'];
			result.sales = value.sales;
			result.revenue = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;

			if(vendorId){
				result.gtc_processing_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
				result.vendor_revenue = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			}else{
				result.vendor_pay = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
				result.gtc_revenue = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			}

			finalresults.push(result);
		}
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

export function compareUserPerformancecsv(req, res) {

	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
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
		var finalresults = [];
		for (let value of results.lhs_result) {
			value.total_fees = ((value.total_fees) > 0) ? (parseFloat(value.total_fees)).toFixed(2) : 0;
			value.vendor_fees = ((value.vendor_fees) > 0) ? (parseFloat(value.vendor_fees)).toFixed(2) : 0;
			value.gtc_fees = ((value.gtc_fees) > 0) ? (parseFloat(value.gtc_fees)).toFixed(2) : 0;
			delete value['Order.User.last_name'];
			delete value['Order.user_id'];
			delete value['Order.User.id'];
			delete value['Order.id'];
			finalresults.push(value);
		}
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

