'use strict';

const moment = require('moment');
var _ = require('lodash');
const service = require('../service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const sequelize = require('sequelize');

export async function AccountingReport(vendorID, queryParams) {
	var accounting = {};
	accounting['membership'] = 0;
	accounting['featured_product'] = 0;
	accounting['processing_fees'] = 0;
	accounting['subscription_fees'] = 0;
	accounting['payment_in_escrow'] = 0;
	accounting['gtc_pay_escrow'] = 0;

	var queryObj = {};
	queryObj.created_on = {};
	
	var adminQueryObj = {};

	try {
		if (vendorID) {
			queryObj.vendor_id = vendorID;
			adminQueryObj.vendor_id = vendorID;
		}

		if (queryParams.start_date && queryParams.end_date) {
			queryObj.created_on['$gte'] = queryParams.start_date;
			queryObj.created_on['$lte'] = queryParams.end_date;
		}

		const memberShipExpensiveResponse = await model['VendorPlan'].findAll({
			include: [{
				model: model['Payment'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'amount']
			}],
			where: queryObj,
			attributes: ['id', 'plan_id', 'vendor_id', 'payment_id']
		});
		const memberShipExpensive = await JSON.parse(JSON.stringify(memberShipExpensiveResponse));
		accounting['membership'] = await parseFloat(_.sumBy(memberShipExpensive, 'Payment.amount'));

		const featuredProductExpensiveResponse = await model['FeaturedProduct'].findAll({
			include: [{
				model: model['Product'],
				where: adminQueryObj,
				attributes: []
			}, {
				model: model['Payment'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'amount']
			}],
			where: {
				created_on: queryObj.created_on
			},
			attributes: ['id', 'product_id', 'payment_id']
		});
		const featuredProductExpensive = await JSON.parse(JSON.stringify(featuredProductExpensiveResponse));
		accounting['featured_product'] = await parseFloat(_.sumBy(featuredProductExpensive, 'Payment.amount'));
		adminQueryObj.created_on = queryObj.created_on;
		const productAdSettingsExpensiveResponse = await model['ProductAdsSetting'].findAll({
			include: [ {
				model: model['Payment'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'amount']
			}],
			where:adminQueryObj ,
			attributes: ['id', 'product_id', 'payment_id']
		});
		delete adminQueryObj.created_on;
		const productAdSettingsExpensive = await JSON.parse(JSON.stringify(productAdSettingsExpensiveResponse));

		accounting['featured_product'] = accounting['featured_product'] + await parseFloat(_.sumBy(productAdSettingsExpensive, 'Payment.amount'));

		const processingFees = await model['OrderVendor'].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('sum', sequelize.col('gtc_fees')), 'amount']
			]
		});
		if ( processingFees.length > 0 )
			accounting['processing_fees'] = processingFees[0].amount != null ? parseFloat(processingFees[0].amount) : 0;

		const subscriptionFees = await model['OrderVendor'].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('sum', sequelize.col('plan_fees')), 'amount']
			]
		});
		if (subscriptionFees.length > 0) 
			accounting['subscription_fees'] = subscriptionFees[0].amount != null ? parseFloat(subscriptionFees[0].amount) : 0;

		
		const paymentInEscrow = await model['OrderVendor'].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('sum', sequelize.col('final_price')), 'amount']
			]
		});
		if (subscriptionFees.length > 0)
			accounting['payment_in_escrow'] = paymentInEscrow[0].amount != null ? parseFloat(paymentInEscrow[0].amount) : 0;


		/*const gtcPaymentEscrow = await model['OrderVendor'].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('sum', sequelize.col('gtc_fees')), 'amount']
			]
		});
		accounting['gtc_pay_escrow_fees'] = gtcPaymentEscrow.length > 0 ? gtcPaymentEscrow[0].amount : 0;*/

		adminQueryObj.created_on = queryObj.created_on;

		const gtcPaymentEscrow = await model['OrderVendor'].findAll({
			raw: true,
			where: adminQueryObj,
			attributes: [],
			include: [{
				model: model['OrderVendorPayout'],
				where: {},
				attributes: [],
				include: [{
					model: model['Payment'],
					where: {},
					attributes: [[sequelize.fn('sum', sequelize.col('amount')), 'amount']]
				}]
			}]
		});		
		if(!_.isUndefined(gtcPaymentEscrow['OrderVendorPayouts.Payment.amount']))
			accounting['gtc_pay_escrow'] = parseFloat(gtcPaymentEscrow['OrderVendorPayouts.Payment.amount']);		

		//accounting['total'] = _.sum(Object.values(accounting));
		accounting['total'] = accounting['membership'] + accounting['featured_product'] + accounting['processing_fees'] + accounting['subscription_fees'];
		delete adminQueryObj.created_on;
		
		return accounting;
	} catch (error) {
		return error;
	}
}

export async function adFeaturedRevenue(req,res){
	var offset = req.query.offset ? parseInt(req.query.offset) : 0;
	var limit = req.query.limit ? parseInt(req.query.limit) : 10;
	var productAdsSettingTable = 'ProductAdsSetting';
	var queryObj = req.query;
	var queryObj1 ={};
	var queryObj2 =  {}
	var newArray = [];
	var results = {};
	var productQuery ={};

	var type = req.query.type ? parseInt(req.query.type) : 0;
	if(queryObj.vendorID){
		queryObj1.vendor_id = queryObj.vendorID;
		productQuery.vendor_id = queryObj.vendorID;
	}
	if (queryObj.fromDate && queryObj.toDate) {

		if (queryObj.columnName) {

			queryObj1[queryObj.columnName] = {

				'$gte': new Date(parseInt(queryObj.fromDate)),
				'$lte': new Date(parseInt(queryObj.toDate))
			}
			queryObj2[req.query.columnName]= queryObj1[req.query.columnName];
			delete queryObj.columnName;
		}
		delete queryObj.fromDate;
		delete queryObj.toDate;
	}
	if(queryObj.position){
		if(type == 1){
			if(queryObj.position != 7){
			queryObj1['position'] = queryObj.position;
			}
		}else if(type == 2){
			if(queryObj.position == 1){
				queryObj2['position_homepage'] = 1;			
			}else if(queryObj.position == 2){
				queryObj2['position_wholesale_landing'] = 1;			
			}else if(queryObj.position == 3){
				queryObj2['position_shop_landing'] = 1;			
			}else if(queryObj.position == 4){
				queryObj2['position_service_landing'] = 1;			
			}else if(queryObj.position == 5){
				queryObj2['position_subscription_landing'] = 1;			
			}else if(queryObj.position == 6){
				queryObj2['position_profilepage'] = 1;			
			}else{
				queryObj2['position_searchresult'] = 1;			
			}
		}
		else{
			if(queryObj.position == 1){
				queryObj2['position_homepage'] = 1;
			}else if(queryObj.position == 2){
				queryObj2['position_wholesale_landing'] = 1;			
			}else if(queryObj.position == 3){
				queryObj2['position_shop_landing'] = 1;			
			}else if(queryObj.position == 4){
				queryObj2['position_service_landing'] = 1;			
			}else if(queryObj.position == 5){
				queryObj2['position_subscription_landing'] = 1;			
			}else if(queryObj.position == 6){
				queryObj2['position_profilepage'] = 1;			
			}else{
				queryObj2['position_searchresult'] = 1;			
			}	

			if(queryObj.position != 7){
				queryObj1['position'] = queryObj.position;
			}else{
				queryObj1['position'] = 0;
			}
		}		
	}

	if(queryObj.last30days){
		var startDate = moment().add(-30,'days');
		var endDate = moment().format("YYYY-MM-DD");
		queryObj1['created_on'] = {
				'$gte':startDate,
				'$lte':endDate
			}
			queryObj2['created_on']= queryObj1['created_on'];
	}

	if(queryObj.text){
		queryObj1['name']={
			$like: '%'+ queryObj.text +'%'
		}
		productQuery['product_name'] = queryObj1['name'];
	}


	results.count = 0;
	results.total = 0;
	try{
	if (type == 0 || type == 1) {
		await model[productAdsSettingTable].findAndCountAll({
			where: queryObj1,
			include: [{
				model: model['Payment'],
				attributes: ['id', 'amount'],
				required: false
			}],
			attributes: ['id', ['name', 'product_name'], 'position', 'start_date', 'end_date', 'status', 'impression', 'clicks', 'created_by', 'created_on', 'last_updated_by', 'last_updated_on']
		}).then(function(response) {
			results.count = results.count + response.count;
			var arrayItem = JSON.parse(JSON.stringify(response.rows));

			_.forOwn(arrayItem, function(element) {
				element['type'] = 1;
				element['feature_indefinitely'] = null;
				newArray.push(element);
			});
		});
	}
	if (type == 0 || type == 2) {
		const featuredProductTable = 'FeaturedProduct';
		await model[featuredProductTable].findAndCountAll({
			where: queryObj2,
			include: [{
				model: model['Product'],
				where:productQuery,
				attributes: ['product_name']
			}, {
				model: model['Payment'],
				attributes: ['id', 'amount'],
				required: false
			}],
			attributes: ['id', 'position_homepage','feature_indefinitely', 'position_searchresult', 'position_profilepage', 'position_wholesale_landing', 'position_shop_landing', 'position_service_landing', 'position_subscription_landing', 'start_date', 'status', 'end_date', 'impression', 'clicks', 'created_by', 'created_on', 'last_updated_by', 'last_updated_on']
		}).then(function(response) {
			results.count = results.count + response.count;
			var arrayItem = JSON.parse(JSON.stringify(response.rows));
			_.forOwn(arrayItem, function(element) {
				element.type = 2;
				element.product_name = element.Product.product_name;
				newArray.push(element);
			});
		});
	}
	let arrayEle = _.orderBy(newArray, 'created_on', 'desc');
	arrayEle = arrayEle.slice(offset, offset + limit);
	var total_count = 0;
	for (var i = 0; i < arrayEle.length; i++) {
		if(arrayEle[i].Payment){
			if(arrayEle[i].Payment.amount != null)
			total_count = total_count + parseInt(arrayEle[i].Payment.amount);
		}
	}
	results.rows = arrayEle;
	results.total = total_count;
	return results;
} catch (error) {
		console.log("Error::::::::::::::",error)
		done(error);
	}
}