'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const statusCode = require('../../config/status');
const carrierCode = require('../../config/carriers');
const orderStaus = require('../../config/order_status');
const sendEmail = require('../../agenda/send-email');
const ReportService = require('../../utilities/reports');
var moment = require('moment');
var async = require('async');


export function generateReports(req, res){
	var result = {};
	var orderItemQueryObj = {};	
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
	if(req.query.lhs_from && req.query.lhs_to){
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.lhs_to).format("YYYY-MM-DD hh:mm:ss"))
	} else {
		lhsBetween.push(moment().subtract(14, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"));
	}
	if(req.query.rhs_from && req.query.rhs_to){
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.rhs_to).format("YYYY-MM-DD hh:mm:ss"));
	} else {
		rhsBetween.push(moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().format("YYYY-MM-DD hh:mm:ss"));
	}

	ReportService.topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		result.top_products = results;		
		return result;
	}).then(function(){
		return ReportService.topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.top_marketplaces = results;
			return result;
		});
	}).then(function(){
		return ReportService.topPerformingCategories(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.top_categories = results;
			return result;
		});
	}).then(function(){
		return ReportService.revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.revenue_changes = results;
			return result;
		});
	}).then(function(){
		return ReportService.revenueChangesCounts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.revenue_counts = results;
			return res.status(200).send(result);
		});
	}).catch((err) => {
		console.log('generate reports err', err);
		return res.status(500).send(err);
	});
}

export function topProducts(req, res) {	
	var orderItemQueryObj = {};	
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
	if(req.query.lhs_from && req.query.lhs_to){
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.lhs_to).format("YYYY-MM-DD hh:mm:ss"))
	} else {
		lhsBetween.push(moment().subtract(14, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"));
	}
	if(req.query.rhs_from && req.query.rhs_to){
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.rhs_to).format("YYYY-MM-DD hh:mm:ss"));
	} else {
		rhsBetween.push(moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().format("YYYY-MM-DD hh:mm:ss"));
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
	if(req.query.lhs_from && req.query.lhs_to){
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.lhs_to).format("YYYY-MM-DD hh:mm:ss"))
	} else {
		lhsBetween.push(moment().subtract(14, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"));
	}
	if(req.query.rhs_from && req.query.rhs_to){
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.rhs_to).format("YYYY-MM-DD hh:mm:ss"));
	} else {
		rhsBetween.push(moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().format("YYYY-MM-DD hh:mm:ss"));
	}
	ReportService.topPerformingMarketPlaces(orderItemQueryObj).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('topMarketPlace err', err);
		return res.status(500).send(err);
	});
}

export function topCategories(req, res) {
	console.log('req user', req.user);
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];	
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
	if(req.query.lhs_from && req.query.lhs_to){
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.lhs_to).format("YYYY-MM-DD hh:mm:ss"))
	} else {
		lhsBetween.push(moment().subtract(14, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"));
	}
	if(req.query.rhs_from && req.query.rhs_to){
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.rhs_to).format("YYYY-MM-DD hh:mm:ss"));
	} else {
		rhsBetween.push(moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().format("YYYY-MM-DD hh:mm:ss"));
	}
	ReportService.topPerformingCategories(orderItemQueryObj).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('topCategories err', err);
		return res.status(500).send(err);
	});
}

export function recentRevenueChanges(req, res) {
	console.log('req user', req.user);
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];	
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
	if(req.query.lhs_from && req.query.lhs_to){
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.lhs_to).format("YYYY-MM-DD hh:mm:ss"))
	} else {
		lhsBetween.push(moment().subtract(14, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"));
	}
	if(req.query.rhs_from && req.query.rhs_to){
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.rhs_to).format("YYYY-MM-DD hh:mm:ss"));
	} else {
		rhsBetween.push(moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().format("YYYY-MM-DD hh:mm:ss"));
	}
	ReportService.revenueChanges(orderItemQueryObj).then((results) => {
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
	if(req.query.lhs_from && req.query.lhs_to){
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.lhs_to).format("YYYY-MM-DD hh:mm:ss"))
	} else {
		lhsBetween.push(moment().subtract(14, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"));
	}
	if(req.query.rhs_from && req.query.rhs_to){
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY-MM-DD hh:mm:ss"), moment(req.query.rhs_to).format("YYYY-MM-DD hh:mm:ss"));
	} else {
		rhsBetween.push(moment().subtract(7, 'days').format("YYYY-MM-DD hh:mm:ss"), moment().format("YYYY-MM-DD hh:mm:ss"));
	}
	ReportService.revenueChangesCounts(orderItemQueryObj).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('recentRevenueChanges err', err);
		return res.status(500).send(err);
	});
}