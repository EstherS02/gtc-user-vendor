'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const sequelize = require('sequelize');
const service = require('../service');
const statusCode = require('../../config/status');
const vendorPlan = require('../../config/gtc-plan');
const carrierCode = require('../../config/carriers');
const orderStaus = require('../../config/order_status');
const ReportService = require('../../utilities/reports');
const reportsService = require('../../api/reports/reports.service');
var moment = require('moment');
var async = require('async');


export function generateReports(req, res) {
	var result = {};
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
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

	ReportService.topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		result.top_products = results;
		return result;
	}).then(function() {
		return ReportService.topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.top_marketplaces = results;
			return result;
		});
	}).then(function() {
		return ReportService.topPerformingCategories(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.top_categories = results;
			return result;
		});
	}).then(function() {
		return ReportService.revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.revenue_changes = results;
			return result;
		});
	}).then(function() {
		return ReportService.revenueChangesCounts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.revenue_counts = results;
			return res.status(200).send(result);
		});
	}).catch((err) => {
		console.log('generate reports err', err);
		return res.status(500).send(err);
	});
}

export function topSellingCities(req, res) {
	var queryObj = {};
	var result = {};
	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	model['OrderItem'].findAll({
		raw: true,
		include: [{
			model: model['Product'],
			where: {},
			attributes: ['city']
		}],
		attributes: [
			[sequelize.fn('sum', sequelize.col('final_price')), 'total_sales']
		],
		group: ['Product.city'],
		order: [
			[sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
		],
		limit: 5
	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(200).send(error);
	});
}


export function topActiveBuyers(req, res) {
	var queryObj = {};
	var result = {};
	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	model['Order'].findAll({
		raw: true,
		where: {},
		order: [
			['created_on', 'DESC']
		],
		group: 'user_id',
		include: [{
			model: model['User'],
			where: {},
			attributes: ['first_name', 'last_name', 'user_pic_url']
		}],
		/*include: [{
			model: model['User'],
			where: {},
			attributes: ['first_name','last_name', 'user_pic_url']			
		},{
			model: model["Product"],
			where: queryObj,
			attributes:[]
		}],*/
		attributes: ['id', 'user_id', 'created_on'],
		limit: 5
	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(200).send(error);
	});
}

export function latestTickets(req, res) {
	var queryObj = {};
	var result = {};
	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	model['TicketThread'].findAll({
		raw: true,
		where: {},
		order: [
			['created_on', 'DESC']
		],
		group: 'user_id',
		include: [{
			model: model['User'],
			where: {},
			attributes: ['first_name', 'last_name', 'user_pic_url']
		}],
		attributes: ['id', 'user_id', 'message', 'status', 'created_on'],
		limit: 5
	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(200).send(error);
	});
}

export function latestRefunds(req, res) {
	var queryObj = {};
	var vendorQuery = {};
	var result = {};
	if (req.user.role == 2)
		vendorQuery.vendor_id = req.user.Vendor.id;
	queryObj.order_item_status = 6;
	model['User'].findAll({
		attributes: ['id', 'first_name', 'last_name', 'status'],
		limit: 5,
		include: [{
			model: model['Order'],
			attributes: ['id'],
			include: [{
				model: model['OrderItem'],
				attributes: ['id', 'order_item_status'],
				where: queryObj,
				include: [{
					model: model['Product'],
					where: vendorQuery,
					attributes: []
				}]
			}]
		}]
	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(200).send(error);
	});
}

export function topProducts(req, res) {
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
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

	ReportService.topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('topProducts err', err);
		return res.status(500).send(err);
	});
}

export function topMarketPlace(req, res) {
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
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
	ReportService.topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('topMarketPlace err', err);
		return res.status(500).send(err);
	});
}

export function topCategories(req, res) {
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
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
	ReportService.topPerformingCategories(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('topCategories err', err);
		return res.status(500).send(err);
	});
}

export function recentRevenueChanges(req, res) {
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
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
	ReportService.revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('recentRevenueChanges err', err);
		return res.status(500).send(err);
	});
}


export function revenueChangesCount(req, res) {
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
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
	ReportService.revenueChangesCounts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('recentRevenueChanges err', err);
		return res.status(500).send(err);
	});
}

export function comparePerformance(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

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

	ReportService.performanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}
export function vendorTrail(req, res) {
	var queryObj = {};
	var planQueryObj = {};
	var offset = 0;
	var limit = 5;
	var order = 'asc';
	var field = 'created_on';
	queryObj.status = statusCode['ACTIVE'];
	planQueryObj.plan_id = vendorPlan['STARTER_SELLER'];
	planQueryObj.status = statusCode['ACTIVE'];
	var includeArr = [{
		model: model['VendorPlan'],
		attributes: ['id', 'start_date', 'end_date', 'status'],
		where: planQueryObj
	}];
	model["Vendor"].findAll({
		include: includeArr,
		where: queryObj,
		attributes: ['id', 'vendor_name'],
		offset: offset,
		limit: limit,
		order: [
			[field, order]
		]
	}).then(function(rows) {
		if (rows.length > 0) {
			return res.status(200).send(rows);
		} else {
			return res.status(200).send(rows);
		}
	}).catch(function(error) {
		console.log("error:::::::", error)
		return res.status(500).send(error);
	});
}
export function accounting(req, res) {
	var accountingQueryParams = {};
	if (req.query.start_date) {
		accountingQueryParams['start_date'] = new Date(parseInt(req.query.start_date));
		accountingQueryParams['end_date'] = new Date(parseInt(req.query.end_date));
	} else {
		accountingQueryParams['start_date'] = moment().subtract(30, 'days').format('YYYY-MM-DD');
		accountingQueryParams['end_date'] = moment().subtract(1, 'days').format('YYYY-MM-DD');

	}
	reportsService.AccountingReport(0, accountingQueryParams)
		.then((response) => {
			console.log(response)
			return res.status(200).send(response);
		})
		.catch((error) => {
			console.log(error)
			return res.status(200).send("internal server error");
		});
}