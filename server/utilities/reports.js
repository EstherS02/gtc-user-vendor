'use strict';

const status = require('../config/status');
const orderStatus = require('../config/order_status');
const orderItemStatus = require('../config/order-item-status');
const position = require('../config/position');
const model = require('../sqldb/model-connect');
const sequelize = require('sequelize');
const SequelizeInstance = require('../sqldb/index');
const async = require('async');
const moment = require('moment');
const _ = require('lodash');

const Op = sequelize.Op;

function sumofPrice(modelName, queryObj) {
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
		}).catch(function(err) {
			reject(err);
		});

	});
}

function sumofCount(modelName, queryObj) {
	return new Promise((resolve, reject) => {
		let total;
		return model[modelName].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('count', 1), 'count']
			]
		}).then(function(data) {
			total = data[0].count ? data[0].count : "0";
			resolve(total);
		}).catch(function(err) {
			reject(err);
		});

	});
}

function getAllPerformance(queryObj, limit, offset) {
	return new Promise((resolve, reject) => {
			SequelizeInstance.query(`SELECT
				orders.id AS order_id,
				order_items.product_id AS product_id,
    			( SELECT product_name FROM product WHERE product.id = order_items.product_id 
     				LIMIT 1 ) AS product_name,
     			( SELECT url FROM product_media WHERE product_media.product_id = product.id
					LIMIT 1 ) AS product_url,
    			( SELECT NAME FROM marketplace WHERE product.marketplace_id = marketplace.id
					LIMIT 1 ) AS marketplace_name,
    			SUM(orders.total_price) AS total_sales,
    			SUM(orders.total_price) - SUM(orders.gtc_fees) AS vendor_fee,
    			SUM(orders.gtc_fees) AS gtc_fees
				FROM
    					orders
					LEFT OUTER JOIN order_items ON orders.id = order_items.order_id
					LEFT OUTER JOIN product ON order_items.product_id = product.id
				WHERE
    				product.vendor_id = :vendor_id and order_items.created_on between :from and :to
				GROUP BY
    				order_items.product_id
    			ORDER BY SUM(orders.total_price) DESC
				LIMIT :limit OFFSET :offset`, {
			replacements: {
				vendor_id: queryObj.vendor_id,
				from: moment(queryObj.from).format("YYYY-MM-DD"),
				to: moment(queryObj.to).format("YYYY-MM-DD"),
				limit: limit,
				offset: offset
			},
			type: sequelize.QueryTypes.SELECT
		}).then(data => {
			resolve(data);
		}).catch(function(err){
			console.log('getAllPerformance error ', err);
			reject(err);
		});
	});

}


export function topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween) {
	console.log('topPerformingProducts', orderItemQueryObj);
	return new Promise((resolve, reject) => {
		var result = {};
		const pastRange = _.assign({}, orderItemQueryObj);
		pastRange.item_created_on = {
			$between: lhsBetween
		};
		const currentRange = _.assign({}, orderItemQueryObj);
		currentRange.item_created_on = {
			$between: rhsBetween
		};
		console.log('pastRange', pastRange);
		console.log('currentRange', currentRange);
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
			return sumofPrice('OrderItemsOverview', orderItemQueryObj).then(function(total) {
				result.total = total;
				return result;
			});
		}).then(function() {
			return sumofPrice('OrderItemsOverview', pastRange).then(function(total) {
				result.past_total = total;
				return result;
			});
		}).then(function() {
			return sumofPrice('OrderItemsOverview', currentRange).then(function(total) {
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
		pastRange.item_created_on = {
			$between: lhsBetween
		};
		const currentRange = _.assign({}, orderItemQueryObj);
		currentRange.item_created_on = {
			$between: rhsBetween
		};
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
			return sumofPrice('OrderItemsOverview', orderItemQueryObj).then(function(total) {
				result.total = total;
				return result;
			});
		}).then(function() {
			return sumofPrice('OrderItemsOverview', pastRange).then(function(total) {
				result.past_total = total;
				return result;
			});
		}).then(function() {
			return sumofPrice('OrderItemsOverview', currentRange).then(function(total) {
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
		pastRange.item_created_on = {
			$between: lhsBetween
		};
		const currentRange = _.assign({}, orderItemQueryObj);
		currentRange.item_created_on = {
			$between: rhsBetween
		};
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
			return sumofPrice('OrderItemsOverview', orderItemQueryObj).then(function(total) {
				result.total = total;
				return result;
			});
		}).then(function() {
			return sumofPrice('OrderItemsOverview', pastRange).then(function(total) {
				result.past_total = total;
				return result;
			});
		}).then(function() {
			return sumofPrice('OrderItemsOverview', currentRange).then(function(total) {
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
	pastRange.item_created_on = {
		$between: lhsBetween
	};
	const currentRange = _.assign({}, orderItemQueryObj);
	currentRange.item_created_on = {
		$between: rhsBetween
	};
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
	pastRange.item_created_on = {
		$between: lhsBetween
	};
	const currentRange = _.assign({}, orderItemQueryObj);
	currentRange.item_created_on = {
		$between: rhsBetween
	};

	return new Promise((resolve, reject) => {
		async.series({
				revenue: function(callback) {
					var result = {};
					return sumofPrice('OrderItemsOverview', pastRange).then(function(total) {
						result.past_revenue = total;
						return result;
					}).then(function() {
						return sumofPrice('OrderItemsOverview', currentRange).then(function(total) {
							result.current_revenue = total;
							result.diff_revenue = result.current_revenue - result.past_revenue;
							return callback(null, result);
						});
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(error);
					});
				},
				revenue_count: function(callback) {
					var result = {};
					return sumofCount('OrderItemsOverview', pastRange).then(function(total) {
						result.past_count = total;
						return result;
					}).then(function() {
						return sumofCount('OrderItemsOverview', currentRange).then(function(total) {
							result.current_count = total;
							result.diff_count = result.current_count - result.past_count;
							return callback(null, result);
						});
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(error);
					});
				},
				completed_count: function(callback) {
					var result = {};
					pastRange.order_status = orderStatus["CONFIRMEDORDER"];
					return sumofCount('OrderItemsOverview', pastRange).then(function(total) {
						result.past_completed = total;
						return result;
					}).then(function() {
						currentRange.order_status = orderStatus["CONFIRMEDORDER"];
						return sumofCount('OrderItemsOverview', currentRange).then(function(total) {
							result.current_completed = total;
							result.diff_completed = result.current_completed - result.past_completed;
							return callback(null, result);
						});
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(error);
					});
				},
				returns_count: function(callback) {
					var result = {};
					pastRange.order_status = orderStatus["RETURNEDORDER"];
					return sumofCount('OrderItemsOverview', pastRange).then(function(total) {
						result.past_returned = total;
						return result;
					}).then(function() {
						currentRange.order_status = orderStatus["RETURNEDORDER"];
						return sumofCount('OrderItemsOverview', currentRange).then(function(total) {
							result.current_returned = total;
							result.diff_returned = result.current_returned - result.past_returned;
							return callback(null, result);
						});
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(error);
					});
				},
				refunds_count: function(callback) {
					var result = {};
					pastRange.order_item_status = orderItemStatus["ORDER_CANCELLED_AND_REFUND_INITIATED"];
					return sumofCount('OrderItemsOverview', pastRange).then(function(total) {
						result.past_refunds = total;
						return result;
					}).then(function() {
						currentRange.order_item_status = orderItemStatus["ORDER_CANCELLED_AND_REFUND_INITIATED"];
						return sumofCount('OrderItemsOverview', currentRange).then(function(total) {
							result.current_refunds = total;
							result.diff_refunds = result.current_refunds - result.past_refunds;
							return callback(null, result);
						});
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(error);
					});
				},
				cancelled_count: function(callback) {
					var result = {};
					pastRange.order_status = orderStatus["CANCELLEDORDER"];
					return sumofCount('OrderItemsOverview', pastRange).then(function(total) {
						result.past_cancelled = total;
						return result;
					}).then(function() {
						currentRange.order_status = orderStatus["CANCELLEDORDER"];
						return sumofCount('OrderItemsOverview', currentRange).then(function(total) {
							result.current_cancelled = total;
							result.diff_cancelled = result.current_cancelled - result.past_cancelled;
							return callback(null, result);
						});
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(error);
					});
				},
				disputes_count: function(callback) {
					var result = {};
					pastRange.order_status = orderStatus["DISPATCHEDORDER"];
					return sumofPrice('OrderItemsOverview', pastRange).then(function(total) {
						result.past_disputes = total;
						return result;
					}).then(function() {
						currentRange.order_status = orderStatus["DISPATCHEDORDER"];
						return sumofPrice('OrderItemsOverview', currentRange).then(function(total) {
							result.current_disputes = total;
							result.diff_disputes = result.current_disputes - result.past_disputes;
							return callback(null, result);
						});
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(error);
					});
				}
			},
			function(err, results) {
				if (!err) {
					resolve(results);
				} else {
					reject(err);
				}
			});
	});

}

export function performanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset) {
	console.log('performanceChanges queryObj', queryObj);
	const pastRange = _.assign({}, queryObj);
	pastRange.from = lhsBetween[0];
	pastRange.to = lhsBetween[1];
	const currentRange = _.assign({}, queryObj);
	currentRange.from = rhsBetween[0];
	currentRange.to = rhsBetween[1];
	
	return new Promise((resolve, reject) => {
		var result = {};
		return getAllPerformance(pastRange, limit, offset).then(function(lhsResult) {
			result.lhs_result = lhsResult;
			return result;
		}).then(function(){
			if(queryObj.compare == 'true'){
				return getAllPerformance(currentRange, limit, offset).then(function(rhsResult) {
					result.rhs_result = rhsResult;				
					resolve(result);
				});
			} else {
				resolve(result);
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
	});
}