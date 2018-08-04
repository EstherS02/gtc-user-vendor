'use strict';

const status = require('../config/status');
const orderStatus = require('../config/order_status');
const position = require('../config/position');
const model = require('../sqldb/model-connect');
const sequelize = require('sequelize');
const moment = require('moment');
const _ = require('lodash');

const Op = sequelize.Op;

function sumofTotal(modelName, queryObj){
	return new Promise((resolve, reject) => {
		let total;
		return model[modelName].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('sum', sequelize.col('final_price')), 'amount']
			]
		}).then(function(data) {
			total = data[0].amount ? data[0].amount : "0";
			resolve(total);
		}).catch(function(err){
			reject(err);
		});

	});
}


export function topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween) {
	console.log('topPerformingProducts', orderItemQueryObj);
	return new Promise((resolve, reject) => {
		var result = {};
		const pastRange = _.assign({}, orderItemQueryObj);
		pastRange.item_created_on = { $between: lhsBetween };
		const currentRange = _.assign({}, orderItemQueryObj);
		currentRange.item_created_on = { $between: rhsBetween };
		model['OrderItemsOverview'].findAll({
			raw: true,
			where: orderItemQueryObj,
			attributes: ['product_name', [sequelize.fn('sum', sequelize.col('final_price')), 'amount']],
			group: ['product_id'],
			order: [
				[sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
			],
			limit: 10,
			offset: 0
		}).then(function(results) {
			if (results.length > 0)
				result.rows = results;
			else
				result.rows = [];
			return sumofTotal('OrderItemsOverview', orderItemQueryObj).then(function(total) {
				result.total = total;
				return result;
			});
		}).then(function() {			
			return sumofTotal('OrderItemsOverview', pastRange).then(function(total) {
				result.past_total = total;
				return result;
			});
		}).then(function() {			
			return sumofTotal('OrderItemsOverview', currentRange).then(function(total) {
				result.current_total = total;
				result.diff_total = result.current_total - result.past_total;
				return resolve(result);
			});
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
	});
}

export function topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween) {
	console.log('topPerformingMarketPlaces', orderItemQueryObj);
    return new Promise((resolve, reject) => {
        var result = {};
        const pastRange = _.assign({}, orderItemQueryObj);
		pastRange.item_created_on = { $between: lhsBetween };
		const currentRange = _.assign({}, orderItemQueryObj);
		currentRange.item_created_on = { $between: rhsBetween };
		model['OrderItemsOverview'].findAll({
			raw: true,
			where: orderItemQueryObj,
			attributes: ['marketplace_name', [sequelize.fn('sum', sequelize.col('final_price')), 'amount']],
			group: ['marketplace_id'],
			order: [
            	[sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
            ],
            limit: 10,
            offset: 0
		}).then(function(results) {
			if (results.length > 0)
				result.rows = results;				
			else	
				result.rows = [];				
			return sumofTotal('OrderItemsOverview', orderItemQueryObj).then(function(total) {
				result.total = total;
				return result;
			});
		}).then(function(){
			return sumofTotal('OrderItemsOverview', pastRange).then(function(total) {
				result.past_total = total;
				return result;
			});
		}).then(function(){
			return sumofTotal('OrderItemsOverview', currentRange).then(function(total) {
				result.current_total = total;
				result.diff_total = result.current_total - result.past_total;
				return resolve(result);
			});
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
    })
}

export function topPerformingCategories(orderItemQueryObj, lhsBetween, rhsBetween) {
	console.log('topPerformingCategories', orderItemQueryObj);
    return new Promise((resolve, reject) => {
        var result = {};
		const pastRange = _.assign({}, orderItemQueryObj);
		pastRange.item_created_on = { $between: lhsBetween };
		const currentRange = _.assign({}, orderItemQueryObj);
		currentRange.item_created_on = { $between: rhsBetween };
		model['OrderItemsOverview'].findAll({
			raw: true,
			where: orderItemQueryObj,
			attributes: ['category_name', [sequelize.fn('sum', sequelize.col('final_price')), 'amount']],
			group: ['category_id'],
			order: [
            	[sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
            ],
            limit: 10,
            offset: 0
		}).then(function(results) {
			if (results.length > 0)
				result.rows = results;
			else	
				result.rows = [];				
			return sumofTotal('OrderItemsOverview', orderItemQueryObj).then(function(total) {
				result.total = total;
				return result;
			});
		}).then(function(){
			return sumofTotal('OrderItemsOverview', pastRange).then(function(total) {
				result.past_total = total;
				return result;
			});
		}).then(function(){
			return sumofTotal('OrderItemsOverview', currentRange).then(function(total) {
				result.current_total = total;
				result.diff_total = result.current_total - result.past_total;
				return resolve(result);
			});
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
    })
}

export function revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween) {
	console.log('revenueChanges', orderItemQueryObj);
	const pastRange = _.assign({}, orderItemQueryObj);
	pastRange.item_created_on = { $between: lhsBetween };
	const currentRange = _.assign({}, orderItemQueryObj);
	currentRange.item_created_on = { $between: rhsBetween };
    return new Promise((resolve, reject) => {
        var result = {};
		model['OrderItemsOverview'].findAll({
			raw: true,
			where: pastRange,
			attributes: ['item_created_on', [sequelize.fn('sum', sequelize.col('final_price')), 'amount']],
			group: [sequelize.fn('day', sequelize.col('item_created_on'))],
			order: [
            	['item_created_on', 'ASC']
            ]
		}).then(function(pastResults) {
			result.past_range = pastResults;
			return model['OrderItemsOverview'].findAll({
				raw: true,
				where: currentRange,
				attributes: ['item_created_on', [sequelize.fn('sum', sequelize.col('final_price')), 'amount']],
				group: [sequelize.fn('day', sequelize.col('item_created_on'))],
				order: [
					['item_created_on', 'ASC']
				]
			}).then(function(currentResults) {
				result.current_range = currentResults;
				return resolve(result);
			});
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
    });
}


export function revenueChangesCounts(orderItemQueryObj, lhsBetween, rhsBetween) {	
	const pastRange = _.assign({}, orderItemQueryObj);
	pastRange.item_created_on = { $between: lhsBetween };
	const currentRange = _.assign({}, orderItemQueryObj);
	currentRange.item_created_on = { $between: rhsBetween };
    return new Promise((resolve, reject) => {
        var result = {};
		model['OrderItemsOverview'].findAll({
			raw: true,
			where: orderItemQueryObj,
			attributes: ['order_status', [sequelize.fn('sum', sequelize.col('final_price')), 'amount'], [sequelize.fn('count', 1), 'count']],
			group: ['order_status']
		}).then(function(results) {
			result.rows = results				
			resolve(result);
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
    });
}