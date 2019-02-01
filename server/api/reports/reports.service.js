'use strict';

const moment = require('moment');
var _ = require('lodash');
const service = require('../service');
const status = require('../../config/status');
const SequelizeInstance = require('../../sqldb/index');
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

	var queryObj = {}, vendorId = {};
	queryObj.created_on = {};

	try{

		if (vendorID) {
			queryObj.vendor_id = vendorID;
			vendorId.vendor_id = vendorID;
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
				where: vendorId,
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


		const productAdSettingsExpensiveResponse = await model['ProductAdsSetting'].findAll({
			include: [ {
				model: model['Payment'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'amount']
			}],
			where:queryObj ,
			attributes: ['id', 'product_id', 'payment_id']
		});
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


		const paymentInEscrow = await paymentInEscrowApi(vendorID,queryParams);
		if (paymentInEscrow.length > 0)
			accounting['payment_in_escrow'] = paymentInEscrow[0].amount != null ? parseFloat(paymentInEscrow[0].amount) : 0;


		const gtcPaymentEscrow = await model['OrderVendor'].findAll({
			raw: true,
			where: vendorId,
			attributes: [],
			include: [{
				model: model['OrderVendorPayout'],
				where:  {
					created_on: queryObj.created_on
				},
				attributes: [],
				include: [{
					model: model['Payment'],
					where: {},
					attributes: [[sequelize.fn('sum', sequelize.col('amount')), 'amount']]
				}]
			}]
		});	
		if(!_.isUndefined(gtcPaymentEscrow[0]['OrderVendorPayouts.Payment.amount']))
			accounting['gtc_pay_escrow'] = parseFloat(gtcPaymentEscrow[0]['OrderVendorPayouts.Payment.amount'])?parseFloat(gtcPaymentEscrow[0]['OrderVendorPayouts.Payment.amount']):0;	

		
		accounting['total'] = accounting['membership'] + accounting['featured_product'] + accounting['processing_fees'] + accounting['subscription_fees'];
		return accounting;

	}catch (error) {
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

    productQuery['status']  = {
		'$ne': status["GTC_INACTIVE"]
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
				attributes: ['product_name', 'product_slug', 'id'],
				include:{
					model: model['Marketplace'],
					attributes:['id']
				}
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
			if((arrayEle[i].Payment.amount != null)&&(arrayEle[i].status == 1))
			total_count = total_count + parseInt(arrayEle[i].Payment.amount);
		}
	}
	results.rows = arrayEle;
	results.total = total_count;
	return results;
} catch (error) {
		console.log("Error::",error)
		done(error);
	}
}
function paymentInEscrowApi(vendorID,queryObj){
	var queryResult = `SELECT SUM(order_vendor.final_price) AS amount
					   FROM order_vendor LEFT OUTER JOIN order_vendor_payout 
					   ON order_vendor.id=order_vendor_payout.order_vendor_id 
					   WHERE order_vendor_payout.order_vendor_id IS NULL`;
	if(queryObj.start_date &&queryObj.end_date){
		queryResult = queryResult+` AND order_vendor.created_on between '`+moment(queryObj.start_date).format('YYYY-MM-DD')+`' and '`+moment(queryObj.end_date).format('YYYY-MM-DD')+`'`;
	}
	if(vendorID){
		queryResult = queryResult+` AND order_vendor.vendor_id =`+ vendorID;	
	} 
    return new Promise((resolve, reject) => {
        SequelizeInstance.query(queryResult, {
            type: sequelize.QueryTypes.SELECT
        }).then(data => {
            resolve(data);
        }).catch(function(err) {
            reject(err);
        });
    });
}