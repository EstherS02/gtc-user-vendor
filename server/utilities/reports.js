'use strict';

const status = require('../config/status');
const orderStatus = require('../config/order_status');
const orderItemStatus = require('../config/order-item-new-status');
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
                [sequelize.fn('sum', sequelize.col('final_price')), 'amount']]
        }).then(function(data) {
            if (data.length > 0) {
                total = typeof data[0].amount != 'undefined' && data[0].amount != null ? data[0].amount : "0";
            } else {
                total = "0";
            }
            resolve(parseFloat(total));
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
            if (data.length > 0) {
                total = typeof data[0].count != 'undefined' && data[0].count != null ? data[0].count : "0";
            } else {
                total = "0";
            }
            resolve(parseInt(total));
        }).catch(function(err) {
            reject(err);
        });

    });
}

function getAllPerformance(queryObj, limit, offset) {
    let queryString=`SELECT orderVendor.order_id AS order_id,
                order_item.product_id AS product_id,
                ( SELECT product_name FROM product WHERE product.id = order_item.product_id
                    LIMIT 1 ) AS product_name,
                ( SELECT url FROM product_media WHERE product_media.product_id = product.id
                    LIMIT 1 ) AS product_url,
                ( SELECT NAME FROM marketplace WHERE product.marketplace_id = marketplace.id
                    LIMIT 1 ) AS marketplace_name,
                SUM(orderVendor.total_price) AS total_sales,
                SUM(orderVendor.total_price) - SUM(orderVendor.gtc_fees) AS vendor_fee,
                SUM(orderVendor.gtc_fees) AS gtc_fees
                FROM
                        order_vendor as orderVendor
                    LEFT OUTER JOIN order_item ON orderVendor.order_id = order_item.order_id
                    LEFT OUTER JOIN product ON order_item.product_id = product.id
                WHERE
                    order_item.created_on between :from and :to `;
                    if(queryObj.vendor_id>0){
                    queryString = queryString+` and product.vendor_id =`+queryObj.vendor_id;
                }
                queryString = queryString+` GROUP BY
                    order_item.product_id
                ORDER BY SUM(orderVendor.total_price) DESC
                LIMIT :limit OFFSET :offset`;
    return new Promise((resolve, reject) => {
        SequelizeInstance.query(queryString, {
            replacements: {
                from: moment(queryObj.from).format("YYYY-MM-DD"),
                to: moment(queryObj.to).format("YYYY-MM-DD"),
                limit: limit,
                offset: offset
            },
            type: sequelize.QueryTypes.SELECT
        }).then(data => {
            resolve(data);
        }).catch(function(err) {
            console.log('getAllPerformance error ', err);
            reject(err);
        });
    });
}

function getAllPerformanceApi(queryObj, limit, offset,attributes,groupBy,includeArr) {
    let queryObject = {
        item_created_on: {
             $between: [queryObj.from, queryObj.to]
        },
        '$or': [{
                    order_item_status: orderItemStatus['ORDER_INITIATED']
                }, {
                    order_item_status:orderItemStatus['CONFIRMED']
                },{
                    order_item_status: orderItemStatus['SHIPPED']
                }, {
                    order_item_status:orderItemStatus['DELIVERED']
                },{
                    order_item_status:orderItemStatus['COMPLETED']
                }]
        };
        let includeArray = includeArr ? includeArr:[];
    return new Promise((resolve, reject) => {

    model['OrderItemOverview'].findAll({
            raw: true,
            where: queryObject,
            attributes: attributes,
            include:includeArray,
            limit:limit,
            offset:offset,
            group: [groupBy],
            order: [
                [sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
            ],
        }).then(function(results) {
            resolve(results);
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        });
    });
}

function getAllCountryPerformance(queryObj, limit, offset,attributes,groupBy,includeArr) {
    let queryObject = {
        created_on: {
             $between: [queryObj.from, queryObj.to]
        },
        '$or': [{
                    order_item_status: orderItemStatus['ORDER_INITIATED']
                }, {
                    order_item_status:orderItemStatus['CONFIRMED']
                },{
                    order_item_status: orderItemStatus['SHIPPED']
                }, {
                    order_item_status:orderItemStatus['DELIVERED']
                },{
                    order_item_status:orderItemStatus['COMPLETED']
                }],
        };
    let includeArray = includeArr ? includeArr:[];
    return new Promise((resolve, reject) => {

    model['OrderItem'].findAll({
            raw: true,
            where: queryObject,
            attributes:  [[sequelize.fn('sum', sequelize.col('OrderItem.price')), 'total_fees'],
                        [sequelize.fn('sum', sequelize.col('final_price')), 'vendor_fees'],
                        [sequelize.fn('sum', sequelize.col('quantity')), 'sales'],
                        [sequelize.literal('(SUM(gtc_fees)+  SUM(plan_fees))'), 'gtc_fees']],
            include:[{
                model:model['Product'],
                attributes:[],
                include:[{
                    model:model['Country'],
                    attributes:['name']
                }]
            }],
            limit:limit,
            offset:offset,
            group: ['Product.product_location'],
            order: [
                [sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
            ],
        }).then(function(results) {
            resolve(results);
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        });
    });
}

function getAllUserPerformance(queryObj, limit, offset,attributes,groupBy,includeArr) {
    let queryObject = {
        created_on: {
             $between: [queryObj.from, queryObj.to]
        },
        '$or': [{
                    order_item_status: orderItemStatus['ORDER_INITIATED']
                }, {
                    order_item_status:orderItemStatus['CONFIRMED']
                },{
                    order_item_status: orderItemStatus['SHIPPED']
                }, {
                    order_item_status:orderItemStatus['DELIVERED']
                },{
                    order_item_status:orderItemStatus['COMPLETED']
                }],
		};
		
    let includeArray = includeArr ? includeArr:[];
    return new Promise((resolve, reject) => {

    model['OrderItem'].findAll({
            raw: true,
            where: queryObject,
            attributes:  [[sequelize.fn('sum', sequelize.col('OrderItem.price')), 'total_fees'],
                        [sequelize.fn('sum', sequelize.col('final_price')), 'vendor_fees'],
                        [sequelize.fn('sum', sequelize.col('quantity')), 'sales'],
                        [sequelize.literal('(SUM(gtc_fees)+  SUM(plan_fees))'), 'gtc_fees']],
            include:[{
                model:model['Order'],
				attributes:['id','user_id'],
				include:[{
                    model:model['User'],
                    attributes:['id','first_name','last_name']
                }]
            }],
            limit:limit,
            offset:offset,
            group: ['Order.user_id'],
            order: [
                [sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
            ],
        }).then(function(results) {
            resolve(results);
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        });
    });
}

function getAllCityPerformance(queryObj, limit, offset,attributes,groupBy,includeArr) {
    let queryObject = {
        created_on: {
             $between: [queryObj.from, queryObj.to]
        },
        '$or': [{
                    order_item_status: orderItemStatus['ORDER_INITIATED']
                }, {
                    order_item_status:orderItemStatus['CONFIRMED']
                },{
                    order_item_status: orderItemStatus['SHIPPED']
                }, {
                    order_item_status:orderItemStatus['DELIVERED']
                },{
                    order_item_status:orderItemStatus['COMPLETED']
                }],
		};
		
    let includeArray = includeArr ? includeArr:[];
    return new Promise((resolve, reject) => {

    model['OrderItem'].findAll({
            raw: true,
            where: queryObject,
            attributes:  [[sequelize.fn('sum', sequelize.col('OrderItem.price')), 'total_fees'],
                        [sequelize.fn('sum', sequelize.col('final_price')), 'vendor_fees'],
                        [sequelize.fn('sum', sequelize.col('quantity')), 'sales'],
                        [sequelize.literal('(SUM(gtc_fees)+ SUM(plan_fees))'), 'gtc_fees']],
            include:[{
                model:model['Product'],
                attributes:['city']
            }],
            limit:limit,
            offset:offset,
            group: ['Product.city'],
            order: [
                [sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
            ],
        }).then(function(results) {
            resolve(results);
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        });
    });
}

function getAllVendorPerformance(queryObj, limit, offset) {

    var queryResult = `SELECT product.vendor_id AS vendor_id,
            vendor.vendor_name As vendor_name,
            users.first_name As owner_name, 
            ( SELECT plan_id FROM vendor_plan WHERE status = 1 and vendor.id = vendor_plan.vendor_id
            LIMIT 1 ) AS type,
            SUM(order_item.quantity) AS sales,
            SUM(order_item.price) AS total_fees,
            SUM(order_item.final_price) AS vendor_fees,
            SUM(order_item.gtc_fees) + SUM(order_item.plan_fees) AS gtc_fees
            FROM
                order_item
                LEFT OUTER JOIN product ON order_item.product_id = product.id
                LEFT OUTER JOIN vendor ON product.vendor_id = vendor.id
                LEFT OUTER JOIN users ON vendor.user_id = users.id
            WHERE
                    order_item.created_on between :from and :to
                    AND (order_item.order_item_status = 1 OR order_item.order_item_status = 2 OR order_item.order_item_status = 3
                     OR order_item.order_item_status = 5 OR order_item.order_item_status = 12)
            GROUP BY
                product.vendor_id
            ORDER BY SUM(order_item.final_price) DESC
            LIMIT :limit OFFSET :offset`

    
    return new Promise((resolve, reject) => {
        SequelizeInstance.query(queryResult, {
            replacements: {
                from: moment(queryObj.from).format("YYYY-MM-DD"),
                to: moment(queryObj.to).format("YYYY-MM-DD"),
                limit: limit,
            	offset: offset
            },
            type: sequelize.QueryTypes.SELECT
        }).then(data => {
			console.log("data::::", data)
            resolve(data);
        }).catch(function(err) {
            reject(err);
        });
    });
}
function getAllProductPerformance(queryObj, limit, offset) {

    var queryResult = `SELECT product.id AS product_id,
            product.product_name,
            marketplace.name AS marketplace_name,
            vendor.vendor_name As vendor_name,
            users.first_name As owner_name, 
            ( SELECT plan_id FROM vendor_plan WHERE status = 1 and vendor.id = vendor_plan.vendor_id
            LIMIT 1 ) AS type,
            SUM(order_item.quantity) AS sales,
            SUM(order_item.price) AS total_fees,
            SUM(order_item.final_price) AS vendor_fees,
            SUM(order_item.gtc_fees) + SUM(order_item.plan_fees) AS gtc_fees
            FROM
                order_item
                LEFT OUTER JOIN product ON order_item.product_id = product.id
                LEFT OUTER JOIN marketplace ON product.marketplace_id = marketplace.id
                LEFT OUTER JOIN vendor ON product.vendor_id = vendor.id
                LEFT OUTER JOIN users ON vendor.user_id = users.id
            WHERE
                    order_item.created_on between :from and :to
                    AND (order_item.order_item_status = 1 OR order_item.order_item_status = 2 OR order_item.order_item_status = 3
                     OR order_item.order_item_status = 5 OR order_item.order_item_status = 12)
            GROUP BY
                product_id
            ORDER BY SUM(order_item.final_price) DESC
            LIMIT :limit OFFSET :offset`

    
    return new Promise((resolve, reject) => {
        SequelizeInstance.query(queryResult, {
            replacements: {
                from: moment(queryObj.from).format("YYYY-MM-DD"),
                to: moment(queryObj.to).format("YYYY-MM-DD"),
                limit: limit,
                offset: offset,
            },
            type: sequelize.QueryTypes.SELECT
        }).then(data => {
            resolve(data);
        }).catch(function(err) {
            reject(err);
        });
    });
}

export function topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween) {
    return new Promise((resolve, reject) => {
		var result = {}, Limit = 5, Offset = 0;

		if(orderItemQueryObj.limit)
			Limit = orderItemQueryObj.limit;

		if(orderItemQueryObj.offset)
			Offset = orderItemQueryObj.offset

		delete orderItemQueryObj.limit;
		delete orderItemQueryObj.offset;

        const pastRange = _.assign({}, orderItemQueryObj);
        pastRange.item_created_on = {
            $between: lhsBetween
        };
        const currentRange = _.assign({}, orderItemQueryObj);
        currentRange.item_created_on = {
            $between: rhsBetween
        };
        model['OrderItemOverview'].findAll({
            raw: true,
            where: orderItemQueryObj,
            attributes: ['product_name', [sequelize.fn('sum', sequelize.col('final_price')), 'amount']],
            group: ['product_id'],
            order: [
                [sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
            ],
            limit: Limit,
            offset: Offset
        }).then(function(results) {

            if (results.length > 0)
                result.rows = results;
            else
                result.rows = [];
            return sumofPrice('OrderItemOverview', orderItemQueryObj).then(function(total) {
                result.total = total;
                return result;
            });
        }).then(function() {
            return sumofPrice('OrderItemOverview', pastRange).then(function(total) {
                result.past_total = total;
                return result;
            });
        }).then(function() {
            return sumofPrice('OrderItemOverview', currentRange).then(function(total) {
                result.current_total = total;
                result.diff_total = result.past_total - result.current_total;
                console.log(result);
                return resolve(result);
            });
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        });
    });
}

export function topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween) {
    return new Promise((resolve, reject) => {
		var result = {},Limit = 5, Offset = 0;

		if(orderItemQueryObj.limit)
			Limit = orderItemQueryObj.limit;

		if(orderItemQueryObj.offset)
			Offset = orderItemQueryObj.offset

		delete orderItemQueryObj.limit;
		delete orderItemQueryObj.offset;

        const pastRange = _.assign({}, orderItemQueryObj);
        pastRange.item_created_on = {
            $between: lhsBetween
        };
        const currentRange = _.assign({}, orderItemQueryObj);
        currentRange.item_created_on = {
            $between: rhsBetween
        };
        pastRange['$or'] = currentRange['$or']=orderItemQueryObj['$or']= [{
                    order_item_status: orderItemStatus['ORDER_INITIATED']
                }, {
                    order_item_status:orderItemStatus['CONFIRMED']
                },{
                    order_item_status: orderItemStatus['SHIPPED']
                }, {
                    order_item_status:orderItemStatus['DELIVERED']
                },{
                    order_item_status:orderItemStatus['COMPLETED']
                }];
                orderItemQueryObj['item_created_on'] = {
                    $between: lhsBetween
                };

        model['OrderItemOverview'].findAll({
            raw: true,
            where: orderItemQueryObj,
            attributes: ['marketplace_id','marketplace_name', [sequelize.fn('sum', sequelize.col('final_price')), 'amount'],
            [sequelize.fn('count', sequelize.col('quantity')), 'sales'],
            [sequelize.literal('(SUM(gtc_fees) + SUM(plan_fees))'), 'gtc_fees']],
            group: ['marketplace_id'],
            order: [
                [sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
            ],
            limit: Limit,
			offset: Offset
			
        }).then(function(results) {
            if (results.length > 0)
                result.rows = results;
            else
                result.rows = [];
            return sumofPrice('OrderItemOverview', orderItemQueryObj).then(function(total) {
                result.total = total;
                return result;
            });
        }).then(function() {
            return sumofPrice('OrderItemOverview', pastRange).then(function(total) {
                result.past_total = total;
                return result;
            });
        }).then(function() {
            return sumofPrice('OrderItemOverview', currentRange).then(function(total) {
                result.current_total = total;
                result.diff_total = result.past_total - result.current_total;
                return resolve(result);
            });
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        });
    })
}

export function topPerformingCities(orderItemQueryObj, lhsBetween, rhsBetween){

	return new Promise((resolve, reject) => {
		var result = {},Limit = 5, Offset = 0;

		if(orderItemQueryObj.limit)
			Limit = orderItemQueryObj.limit;

		if(orderItemQueryObj.offset)
			Offset = orderItemQueryObj.offset

		delete orderItemQueryObj.limit;
		delete orderItemQueryObj.offset;

        const pastRange = _.assign({}, orderItemQueryObj);
        pastRange.item_created_on = {
            $between: lhsBetween
        };
        const currentRange = _.assign({}, orderItemQueryObj);
        currentRange.item_created_on = {
            $between: rhsBetween
		};
		
		model['OrderItem'].findAll({
			raw: true,
			include: [{
				model: model['Product'],
				where: orderItemQueryObj,
				attributes: ['city']
			}],
			attributes: [[sequelize.fn('count', sequelize.col('quantity')), 'sales'],
				[sequelize.fn('sum', sequelize.col('final_price')), 'total_sales'],
				[sequelize.literal('(SUM(gtc_fees) + SUM(plan_fees))'), 'gtc_fees']
			],
			group: ['Product.city'],
			order: [
				[sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
			],
			limit: Limit
	
		}).then(function(results) {
			if (results.length > 0)
				result = results;
			else
				result = [];
			return resolve(result);
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
	})
}

export function topPerformingCategories(orderItemQueryObj, lhsBetween, rhsBetween) {
    return new Promise((resolve, reject) => {
		var result = {},Limit = 5, Offset = 0;

		if(orderItemQueryObj.limit)
			Limit = orderItemQueryObj.limit;

		if(orderItemQueryObj.offset)
			Offset = orderItemQueryObj.offset

		delete orderItemQueryObj.limit;
		delete orderItemQueryObj.offset;

        const pastRange = _.assign({}, orderItemQueryObj);
        pastRange.item_created_on = {
            $between: lhsBetween
        };
        const currentRange = _.assign({}, orderItemQueryObj);
        currentRange.item_created_on = {
            $between: rhsBetween
        };
        pastRange['$or'] = currentRange['$or']=orderItemQueryObj['$or']= [{
                    order_item_status: orderItemStatus['ORDER_INITIATED']
                }, {
                    order_item_status:orderItemStatus['CONFIRMED']
                },{
                    order_item_status: orderItemStatus['SHIPPED']
                }, {
                    order_item_status:orderItemStatus['DELIVERED']
                },{
                    order_item_status:orderItemStatus['COMPLETED']
                }];
        orderItemQueryObj['item_created_on'] = {
            $between: lhsBetween
        };
        model['OrderItemOverview'].findAll({
            raw: true,
            where: orderItemQueryObj,
            attributes: ['category_name', [sequelize.fn('sum', sequelize.col('final_price')), 'amount']],
            group: ['category_id'],
            order: [
                [sequelize.fn('sum', sequelize.col('final_price')), 'DESC']
            ],
            limit: Limit,
			offset: Offset
			
        }).then(function(results) {
            if (results.length > 0)
                result.rows = results;
            else
                result.rows = [];

            return sumofPrice('OrderItemOverview', orderItemQueryObj).then(function(total) {
                result.total = total;
                return result;
            });
        }).then(function() {
            return sumofPrice('OrderItemOverview', pastRange).then(function(total) {
                result.past_total = total;
                return result;
            });
        }).then(function() {
            return sumofPrice('OrderItemOverview', currentRange).then(function(total) {
                result.current_total = total;
                result.diff_total = result.past_total - result.current_total;
                return resolve(result);
            });
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        });
    })
}

export function revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween) {
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
        model['OrderItemOverview'].findAll({
            raw: true,
            where: pastRange,
            attributes: ['item_created_on', [sequelize.fn('sum', sequelize.col('final_price')), 'amount']],
            group: [sequelize.fn('day', sequelize.col('item_created_on'))],
            order: [
                ['item_created_on', 'ASC']
            ]
        }).then(function(pastResults) {
            result.past_range = pastResults;
            return model['OrderItemOverview'].findAll({
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
                    return sumofPrice('OrderItemOverview', pastRange).then(function(total) {
                        result.past_revenue = total;
                        return result;
                    }).then(function() {
                        return sumofPrice('OrderItemOverview', currentRange).then(function(total) {
                            result.current_revenue = total;
                            result.diff_revenue = result.past_revenue - result.current_revenue;
                            return callback(null, result);
                        });
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(error);
                    });
                },
                revenue_count: function(callback) {
                    var result = {};
                    return sumofCount('OrderItemOverview', pastRange).then(function(total) {
                        result.past_count = total;
                        return result;
                    }).then(function() {
                        return sumofCount('OrderItemOverview', currentRange).then(function(total) {
                            result.current_count = total;
                            let per = 0;
                            if( result.current_count > 0 )
                                per = (parseFloat(result.past_count) - parseFloat(result.current_count)) / parseFloat(result.current_count) * 100;
                            result.diff_count = per.toString() + '%';
                            return callback(null, result);
                        });
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(error);
                    });
                },
                completed_count: function(callback) {
                    var result = {};
                    pastRange.order_item_status = orderItemStatus["DELIVERED"];
                    return sumofCount('OrderItemOverview', pastRange).then(function(total) {
                        result.past_completed = total;
                        return result;
                    }).then(function() {
                        currentRange.order_item_status = orderItemStatus["DELIVERED"];
                        return sumofCount('OrderItemOverview', currentRange).then(function(total) {
                            result.current_completed = total;
                            result.diff_completed = result.past_completed - result.current_completed;
                            return callback(null, result);
                        });
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(error);
                    });
                },
                returns_count: function(callback) {
                    var result = {};
                    pastRange.order_item_status = orderItemStatus["RETURN_RECIVED"];
                    return sumofCount('OrderItemOverview', pastRange).then(function(total) {
                        result.past_returned = total;
                        return result;
                    }).then(function() {
                        currentRange.order_item_status = orderItemStatus["RETURN_RECIVED"];
                        return sumofCount('OrderItemOverview', currentRange).then(function(total) {
                            result.current_returned = total;
                            result.diff_returned = result.past_returned - result.current_returned;
                            return callback(null, result);
                        });
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(error);
                    });
                },
                refunds_count: function(callback) {
                    var result = {};
                    pastRange.order_item_status = orderItemStatus["REFUND"];
                    return sumofCount('OrderItemOverview', pastRange).then(function(total) {
                        result.past_refunds = total;
                        return result;
                    }).then(function() {
                        currentRange.order_item_status = orderItemStatus["REFUND"];
                        return sumofCount('OrderItemOverview', currentRange).then(function(total) {
                            result.current_refunds = total;
                            result.diff_refunds = result.past_refunds - result.current_refunds;
                            return callback(null, result);
                        });
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(error);
                    });
                },
                cancelled_count: function(callback) {
                    var result = {};
                    pastRange.order_item_status = {
                        $in: [orderItemStatus["CANCELED"], orderItemStatus["VENDOR_CANCELED"], orderItemStatus["AUTO_CANCELED"]]
                    };
                    return sumofCount('OrderItemOverview', pastRange).then(function(total) {
                        result.past_cancelled = total;
                        return result;
                    }).then(function() {
                        currentRange.order_item_status = {
                            $in: [orderItemStatus["CANCELED"], orderItemStatus["VENDOR_CANCELED"], orderItemStatus["AUTO_CANCELED"]]
                        }
                        return sumofCount('OrderItemOverview', currentRange).then(function(total) {
                            result.current_cancelled = total;
                            result.diff_cancelled = result.past_cancelled - result.current_cancelled;
                            return callback(null, result);
                        });
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(error);
                    });
                },
                disputes_count: function(callback) {
                    var result = {};
                    pastRange.order_item_status = orderItemStatus["SHIPPED"];
                    return sumofPrice('OrderItemOverview', pastRange).then(function(total) {
                        result.past_disputes = total;
                        return result;
                    }).then(function() {
                        currentRange.order_item_status = orderItemStatus["SHIPPED"];
                        return sumofPrice('OrderItemOverview', currentRange).then(function(total) {
                            result.current_disputes = total;
                            result.diff_disputes = result.past_disputes - result.current_disputes;
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
        }).then(function() {
            if (queryObj.compare == 'true') {
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

export function categoryPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset) {
    const pastRange = _.assign({}, queryObj);
    pastRange.from = lhsBetween[0];
    pastRange.to = lhsBetween[1];
    const currentRange = _.assign({}, queryObj);
    currentRange.from = rhsBetween[0];
    currentRange.to = rhsBetween[1];
    var attribute = ['category_id','category_name',[sequelize.fn('sum', sequelize.col('price')), 'total_fees'],
                        [sequelize.fn('sum', sequelize.col('final_price')), 'vendor_fees'],
                        [sequelize.fn('sum', sequelize.col('quantity')), 'sales'],
                        [sequelize.literal('(SUM(gtc_fees)+ SUM(plan_fees))'), 'gtc_fees']];
    var groupBy = 'category_id';    

    return new Promise((resolve, reject) => {
        var result = {};
        return getAllPerformanceApi(pastRange, limit, offset,attribute,groupBy).then(function(lhsResult) {

            result.lhs_result = lhsResult;
            return result;
        }).then(function() {
            if (queryObj.compare == 'true') {
        return getAllPerformanceApi(pastRange, limit, offset,attribute,groupBy).then(function(rhsResult) {

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

export function marketplacePerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset) {	
    const pastRange = _.assign({}, queryObj);
    pastRange.from = lhsBetween[0];
    pastRange.to = lhsBetween[1];
    const currentRange = _.assign({}, queryObj);
    currentRange.from = rhsBetween[0];
    currentRange.to = rhsBetween[1];
    var attribute = ['marketplace_id','marketplace_name',[sequelize.fn('sum', sequelize.col('price')), 'total_fees'],
                        [sequelize.fn('sum', sequelize.col('final_price')), 'vendor_fees'],
                        [sequelize.fn('sum', sequelize.col('quantity')), 'sales'],
                        [sequelize.literal('(SUM(gtc_fees)+ SUM(plan_fees))'), 'gtc_fees']];
    var groupBy = 'marketplace_id';    

    return new Promise((resolve, reject) => {
        var result = {};
        return getAllPerformanceApi(pastRange, limit, offset,attribute,groupBy).then(function(lhsResult) {

            result.lhs_result = lhsResult;
            return result;
        }).then(function() {
            if (queryObj.compare == 'true') {
        return getAllPerformanceApi(pastRange, limit, offset,attribute,groupBy).then(function(rhsResult) {

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

export function productPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset) {
	var queryObj = { vendor_id: null };//NEED TO REMOVE
   	const pastRange = _.assign({}, queryObj);
    pastRange.from = lhsBetween[0];
    pastRange.to = lhsBetween[1];
    const currentRange = _.assign({}, queryObj);
    currentRange.from = rhsBetween[0];
    currentRange.to = rhsBetween[1];
    var groupBy = "product_id";
    return new Promise((resolve, reject) => {
        var result = {};
        return getAllProductPerformance(pastRange, limit, offset,groupBy).then(function(lhsResult) {
            result.lhs_result = lhsResult;
            return result;
        }).then(function() {
            if (queryObj.compare == 'true') {
                return getAllProductPerformance(currentRange, limit, offset,groupBy).then(function(rhsResult) {
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

export function countryPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset){
	var queryObj = { vendor_id: null };//NEED TO REMOVE
 	const pastRange = _.assign({}, queryObj);
    pastRange.from = lhsBetween[0];
    pastRange.to = lhsBetween[1];
    const currentRange = _.assign({}, queryObj);
    currentRange.from = rhsBetween[0];
	currentRange.to = rhsBetween[1];

    return new Promise((resolve, reject) => {
        var result = {};
        return getAllCountryPerformance(pastRange, limit, offset).then(function(lhsResult) {
            result.lhs_result = lhsResult;
            return result;
        }).then(function() {
            if (queryObj.compare == 'true') {
        return getAllCountryPerformance(currentRange, limit, offset).then(function(rhsResult) {
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

export function userPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset){
	var queryObj = { vendor_id: null };//NEED TO REMOVE
	const pastRange = _.assign({}, queryObj);
	pastRange.from = lhsBetween[0];
	pastRange.to = lhsBetween[1];
	const currentRange = _.assign({}, queryObj);
	currentRange.from = rhsBetween[0];
	currentRange.to = rhsBetween[1];

	return new Promise((resolve, reject) => {
		var result = {};
		return getAllUserPerformance(pastRange, limit, offset).then(function(lhsResult) {
			result.lhs_result = lhsResult;
			return result;
		}).then(function() {
			if (queryObj.compare == 'true') {
		return getAllUserPerformance(currentRange, limit, offset).then(function(rhsResult) {
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

export function cityPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset){
	var queryObj = { vendor_id: null };//NEED TO REMOVE
 	const pastRange = _.assign({}, queryObj);
    pastRange.from = lhsBetween[0];
    pastRange.to = lhsBetween[1];
    const currentRange = _.assign({}, queryObj);
    currentRange.from = rhsBetween[0];
	currentRange.to = rhsBetween[1];

    return new Promise((resolve, reject) => {
        var result = {};
        return getAllCityPerformance(pastRange, limit, offset).then(function(lhsResult) {
			result.lhs_result = lhsResult;
            return result;
        }).then(function() {
            if (queryObj.compare == 'true') {
        return getAllCityPerformance(currentRange, limit, offset).then(function(rhsResult) {
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

export function vendorPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset) {
    const pastRange = _.assign({}, queryObj);
    pastRange.from = lhsBetween[0];
    pastRange.to = lhsBetween[1];
    const currentRange = _.assign({}, queryObj);
    currentRange.from = rhsBetween[0];
    currentRange.to = rhsBetween[1];
    return new Promise((resolve, reject) => {
        var result = {};
        return getAllVendorPerformance(pastRange, limit, offset).then(function(lhsResult) {
            result.lhs_result = lhsResult;
            return result;
        }).then(function() {
            if (queryObj.compare == 'true') {
                return getAllVendorPerformance(currentRange, limit, offset).then(function(rhsResult) {
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

// starts export performance selected values//
export function exportperformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset) {
    const pastRange = _.assign({}, queryObj);
    pastRange.from = lhsBetween[0];
    pastRange.to = lhsBetween[1];
    const currentRange = _.assign({}, queryObj);
    currentRange.from = rhsBetween[0];
    currentRange.to = rhsBetween[1];

    return new Promise((resolve, reject) => {
        var result = {};
        return getAllexportPerformance(pastRange, limit, offset).then(function(lhsResult) {
            result.lhs_result = lhsResult;
            return result;
        }).then(function() {
            if (queryObj.compare == 'true') {
                return getAllexportPerformance(currentRange, limit, offset).then(function(rhsResult) {
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
// Ends export performance selected values//

// started selected values to exported the export functions//
function getAllexportPerformance(queryObj, limit, offset) {
	return new Promise((resolve, reject) => {
        SequelizeInstance.query(`SELECT orderVendor.order_id AS order_id,
                order_item.product_id AS product_id,
                ( SELECT product_name FROM product WHERE product.id = order_item.product_id
                    LIMIT 1 ) AS product_name,
                ( SELECT url FROM product_media WHERE product_media.product_id = product.id
                    LIMIT 1 ) AS product_url,
                ( SELECT NAME FROM marketplace WHERE product.marketplace_id = marketplace.id
                    LIMIT 1 ) AS marketplace_name,
                SUM(orderVendor.total_price) AS total_sales,
                SUM(orderVendor.total_price) - SUM(orderVendor.gtc_fees) AS vendor_fee,
                SUM(orderVendor.gtc_fees) AS gtc_fees
                FROM
                        order_vendor as orderVendor
                    LEFT OUTER JOIN order_item ON orderVendor.order_id = order_item.order_id
                    LEFT OUTER JOIN product ON order_item.product_id = product.id
				WHERE
    				product.vendor_id = :vendor_id and order_item.created_on between :from and :to
				GROUP BY
    				order_item.product_id
    			ORDER BY SUM(orderVendor.total_price) DESC
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
        }).catch(function(err) {
            console.log('getAllPerformance error ', err);
            reject(err);
        });
    });
}
// Ends selected values to exported the export functions//