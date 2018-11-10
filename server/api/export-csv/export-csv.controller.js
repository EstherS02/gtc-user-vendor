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
const moment = require('moment');
const model = require('../../sqldb/model-connect');
const async = require('async');
const Json2csvParser = require('json2csv').Parser;
const orderStatus = require('../../config/order_status');


// starts export csv Ad-revenue //
exports.exportcsv = function(req, res) {

	var offset, limit, field, order;
	var queryObj = {};
	var ids = [];
	var type = [];
	let includeArr;
	var adType = {
		"type1": "AD",
		"type2": "Featured Listing",
	};
	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	if (req.query.populate)
		includeArr = populate.populateData(req.query.populate);
	else
		includeArr = [];

	delete req.query.populate;
	if (queryObj.startDate && queryObj.endDate) {
		if (queryObj.columnName) {
			queryObj[queryObj.columnName] = {
				'$gte': new Date(parseInt(queryObj.startDate)),
				'$lte': new Date(parseInt(queryObj.endDate))
			}
			delete queryObj.columnName;
		}
		delete queryObj.startDate;
		delete queryObj.endDate;
	}

	if (!queryObj.status) {
		queryObj['status'] = {
			'$ne': status["DELETED"]
		}
	} else {
		if (queryObj.status == status["DELETED"]) {
			queryObj['status'] = {
				'$eq': status["DELETED"]
			}
		}
	}
	req.endpoint = "AdFeaturedproduct";
	ids = req.query.id;
	type = req.query.type;
	if (ids != '') {
		queryObj['id'] = JSON.parse("[" + ids + "]");
		queryObj['type'] = JSON.parse("[" + type + "]");
		service.findAllRows(req.endpoint, includeArr, queryObj, 0, null, field, order)
			.then(function(rows) {
				for (let value of rows.rows) {
					if (value.type == 1) {
						value.type = adType.type1;
					}
					else {
						value.type = adType.type2;
					}

					if (value.clicks != "null" && value.impression != "null") {
						value.CTR = ((value.clicks / value.impression) * 100).toFixed(2) + "%";
					}
					else {
						value.CTR = 0 + "%";
					}
				}
				var fields = [];
				fields = _.map(rows.rows.columns, 'columnName');
				fields.push('product_name', 'type', 'start_date', 'end_date', 'impression', 'clicks', 'CTR');
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
	else {
		service.getAllFindRow(req.endpoint, includeArr, queryObj, field, order)
			.then(function(rows) {
				for (let value of rows.rows) {
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
						value.CTR = 0 + "%";
					}
				}
				var fields = [];
				fields = _.map(rows.rows.columns, 'columnName');
				fields.push('product_name', 'type', 'start_date', 'end_date', 'impression', 'clicks', 'CTR');
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
// ends export csv Ad-revenue //

// starts export csv order-history//
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
					if (value.order_status != '') {
						Object.keys(orderStatus).forEach(function(key) {
							if (value.order_status == orderStatus[key]) {
								var val1 = key.toLowerCase();
								var val = val1.charAt(0).toUpperCase() + val1.slice(1);
								val = val.replace("order", " "); //Order
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
// ends export csv order-history //

//starts export csv sales-history//
exports.salesHistoryexportcsv = function(req, res) {

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
					if (value.order_status != '') {
						Object.keys(orderStatus).forEach(function(key) {
							if (value.order_status == orderStatus[key]) {
								var val1 = key.toLowerCase();
								var val = val1.charAt(0).toUpperCase() + val1.slice(1);
								val = val.replace("order", " "); //Order
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

