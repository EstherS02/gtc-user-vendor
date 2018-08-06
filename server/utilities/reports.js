'use strict';

const status = require('../config/status');
const orderStatus = require('../config/order_status');
const orderItemStatus = require('../config/order-item-status');
const position = require('../config/position');
const model = require('../sqldb/model-connect');
const sequelize = require('sequelize');
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