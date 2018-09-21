'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const _ = require('lodash');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const marketPlace = require('../../../config/marketplace');
const orderStatus = require('../../../config/order_status');
const orderItemStatus = require('../../../config/order-item-status');
var async = require('async');
const vendorPlan = require('../../../config/gtc-plan');
const carriersCode = require('../../../config/carriers');
const populate = require('../../../utilities/populate');


// salesHistory
export function salesHistory(req, res) {
    
    var LoggedInUser = {};
    var bottomCategory = {};
    var categoryModel = "Category";
    // console.log(req.user.Vendor.id)
    if (req.user)
        LoggedInUser = req.user;

    var queryURI = {};
    var queryPaginationObj = {};
    var orderItemQueryObj = {};
    var orderQueryObj = {};
    var productQueryObj = {};
    var queryUrl = {};
    //  Query string assignment
    var from_date = req.query.from_date;
    var to_date = req.query.to_date;
    var dateSelect = req.query.dateSelect;
    var marketType = req.query.marketType;
    var status = req.query.status;
    var start_date;
    var end_date;
    if (dateSelect) {
        queryURI['dateSelect'] = dateSelect;
        end_date = moment().add(0, 'd').toDate();
        if (dateSelect == "today") {
           var convertMoment = moment();
           start_date =  new Date(convertMoment);
          } else if (dateSelect == "yesterday") {
            start_date = moment().add(-1, 'd').toDate();
            console.log("start_date:::"+start_date);
            end_date = start_date;
        } else if (dateSelect == "last7day") {
            start_date = moment().add(-7, 'd').toDate();
        } else if (dateSelect == "last15day") {
            start_date = moment().add(-15, 'd').toDate();
        } else if (dateSelect == "last30day") {
            start_date = moment().add(-30, 'd').toDate();
        } else {
        //     if (from_date) {
        //         start_date = from_date;
        //     } else {
        //         start_date = moment().add(-70, 'd').toDate();
        //     }
        //     if (to_date) {
        //         end_date = to_date;
        //     } else {
        //         end_date = moment().add(0, 'd').toDate();
        //         // end_date= moment().toDate();
        //     }
        // }

    } 
    // else {
    //     if (from_date) {
    //         start_date = from_date;
    //     } else {
    //         start_date = moment().add(-70, 'd').toDate();
    //     }
    //     if (to_date) {
    //         end_date = to_date;
    //     } else {
    //         end_date = moment().add(0, 'd').toDate();
    //     }
    //     orderQueryObj['ordered_date'] = {
    //         $between: [start_date, end_date]
    //     };
    }
    if(dateSelect){
    orderQueryObj['ordered_date'] = {
        $between: [start_date, end_date]
    };
    queryURI['start_date'] = start_date;
    
    if(from_date && to_date){
    queryURI['end_date'] = end_date;
    }
}


    if (marketType) {
        queryURI['marketType'] = marketType;
        productQueryObj['marketplace_id'] = marketType;
    }
    if (status) {
        queryURI['status'] = status;
        orderQueryObj['order_status'] = orderStatus[status];
    }
    // end Query string assignment
    var order = "desc"; //"asc"
    var offset = 0;
    var limit = 1;
    // var vendor_id = req.user.Vendor.id;
    let user_id = LoggedInUser.id;
    //pagination 
    var page;
    offset = req.query.offset ? parseInt(req.query.offset) : 0;
    queryPaginationObj['offset'] = offset;
    delete req.query.offset;
    limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	queryURI['limit'] = limit;
    delete req.query.limit;
    order = req.query.order ? req.query.order : "desc";
    queryPaginationObj['order'] = order;
    delete req.query.order;
    page = req.query.page ? parseInt(req.query.page) : 1;
    queryPaginationObj['page'] = page;
    delete req.query.page;
    if (req.query.keyword) {
        queryPaginationObj.keyword = req.query.keyword;
        queryURI['keyword'] = req.query.keyword;
        orderQueryObj['id'] = {
            like: '%' + req.query.keyword + '%'
        };
    }
    var field = "id";
    offset = (page - 1) * limit;
    queryPaginationObj['offset'] = offset;
    var maxSize;
    // End pagination
    var modelName = "Order";
    productQueryObj['vendor_id'] = req.user.Vendor.id;
    console.log("productQueryObj", productQueryObj)
    var orderIncludeArr = [
	  	{
       		model: model['Product'],
        	where: productQueryObj,
       		include:[{
            		model: model['Vendor'],
        		}]
        },{
			model: model['User'],
			attributes: ['id','first_name','last_name']

		}
	];
    async.series({
        cartCounts: function(callback) {
            service.cartHeader(LoggedInUser).then(function(response) {
                return callback(null, response);
            }).catch(function(error) {
                console.log('Error :::', error);
                return callback(null);
            });
        },
            orderHistory: function(callback) {
                service.findRows(modelName, orderQueryObj, offset, limit, field, order, orderIncludeArr)
                    .then(function(results) {
                        return callback(null, results);
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(null);
                    });
            },
            categories: function(callback) {
                var includeArr = [];
                const categoryOffset = 0;
                const categoryLimit = null;
                const categoryField = "id";
                const categoryOrder = "asc";
                const categoryQueryObj = {};

                categoryQueryObj['status'] = statusCode["ACTIVE"];

                service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
                    .then(function(category) {
                        var categories = category.rows;
                        bottomCategory['left'] = categories.slice(0, 8);
                        bottomCategory['right'] = categories.slice(8, 16);
                        return callback(null, category.rows);
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(null);
                    });
            }
        },
        function(err, results) {
            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
            maxSize = results.orderHistory.count / limit;
            if (results.orderHistory.count % limit)
                maxSize++;

            var total_transaction = 0.00;
            if (results.orderHistory.count > 0) {
                results.orderHistory.rows.forEach((value, index) => {
                    total_transaction += parseFloat(value.total_price);
                    results.orderHistory.rows[index]['total_price'] = (parseFloat(value.total_price)).toFixed(2);
                });
            }

            queryPaginationObj['maxSize'] = maxSize;
            if (!err) {

				if(dropDownUrl == 'reporting'){
			   
					res.render('vendorNav/reporting/sales-history', {
						title: "Global Trade Connect",
						Order: results.orderHistory.rows,
						count: results.orderHistory.count,
						queryURI: queryURI,
						LoggedInUser: LoggedInUser,
						statusCode: statusCode,
						marketPlace: marketPlace,
						categories: results.categories,
						bottomCategory: bottomCategory,
						queryUrl: queryUrl,
						selectedPage: 'sales-history',
						cartheader: results.cartCounts,
						totalTransaction: (total_transaction).toFixed(2),
						orderStatus: orderStatus,
						
						// pagination
						page: page,
						maxSize: maxSize,
						pageSize: limit,
						queryPaginationObj: queryPaginationObj,
						collectionSize: results.orderHistory.count,
						// End pagination
						vendorPlan: vendorPlan,
						dropDownUrl: dropDownUrl
					});
                }else{

					res.render('vendorNav/my-orders', {
						title: "Global Trade Connect",
						Order: results.orderHistory.rows,
						count: results.orderHistory.count,
						queryURI: queryURI,
						LoggedInUser: LoggedInUser,
						statusCode: statusCode,
						marketPlace: marketPlace,
						categories: results.categories,
						bottomCategory: bottomCategory,
						queryUrl: queryUrl,
						selectedPage: 'order',
						cartheader: results.cartCounts,
						totalTransaction: (total_transaction).toFixed(2),
						orderStatus: orderStatus,
						
						// pagination
						page: page,
						maxSize: maxSize,
						pageSize: limit,
						queryPaginationObj: queryPaginationObj,
						collectionSize: results.orderHistory.count,
						// End pagination
						vendorPlan: vendorPlan
					});

				}
			} else {
                res.render('vendorNav/reporting/sales-history', err);
            }
        });
}
// Ends salesHistory

export function orderView(req, res) {
    var LoggedInUser = {}, bottomCategory = {}, searchObj = {}, 
    productQueryObj={}, itemIncludeArr = [], orderIncludeArr=[];
    var order_id;
    var marketPlaceModel = 'Marketplace';
    var orderItemsModel = 'OrderItem';
    var orderModel = 'Order';
    var categoryModel = "Category";
    productQueryObj['vendor_id'] = req.user.Vendor.id;

    if (req.user)
        LoggedInUser = req.user;

    itemIncludeArr = populate.populateData('Product,Product.Marketplace,Order');
    orderIncludeArr = populate.populateData('Shipping');

    async.series({
        cartCounts: function(callback) {
            service.cartHeader(LoggedInUser).then(function(response) {
                return callback(null, response);
            }).catch(function(error) {
                console.log('Error :::', error);
                return callback(null);
            });
        },
        categories: function(callback) {
            var includeArr = [];
            const categoryOffset = 0;
            const categoryLimit = null;
            const categoryField = "id";
            const categoryOrder = "asc";
            const categoryQueryObj = {};

            categoryQueryObj['status'] = statusCode["ACTIVE"];

            service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
                .then(function(category) {
                    var categories = category.rows;
                    bottomCategory['left'] = categories.slice(0, 8);
                    bottomCategory['right'] = categories.slice(8, 16);
                    return callback(null, category.rows);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },

        order: function(cb){
            if (req.params.id)
                var id = req.params.id;

               return service.findIdRow(orderModel, id,orderIncludeArr)
                .then(function(order){
                    return cb(null, order)
                }).catch(function(error){
                    console.log('Error :::', error);
                    return cb(error);
                })
        },
        orderItems: function(cb) {

            var queryObj = {};
            let includeArr = [];

            if (req.params.id)
               queryObj["order_id"] = req.params.id;

            queryObj['status'] = {
                '$ne': statusCode["DELETED"]
            }

        return model["OrderItem"].findAndCountAll({
                where: queryObj,
                include: [{
                    model: model["Order"],
                    }, {
                    model: model["Product"],
                    where: productQueryObj,
                    include: [{
                        model: model["Vendor"]
                    }, {
                        model: model["Category"]
                    }, {
                        model: model["SubCategory"]
                    }, {
                        model: model["Marketplace"]
                    }, {
                        model: model["MarketplaceType"]
                    }, {
                        model: model["Country"]
                    }, {
                        model: model["State"]
                    }, {
                        model: model["ProductMedia"],
                        where: {
                            base_image: 1,
                            status: {
                                '$eq': statusCode["ACTIVE"]
                            }
                        }
                    }]
                }]
            }).then(function(data) {
                var result = JSON.parse(JSON.stringify(data));
                return cb(null, result)
            }).catch(function(error) {
                console.log('Error:::', error);
                return cb(error);
            });
        },
        marketPlace: function (cb) {

            var searchObj = {};
            let includeArr = [];

            searchObj['status'] = {
                '$eq': statusCode["ACTIVE"]
            }
            return service.findRows(marketPlaceModel, searchObj, null, null, 'created_on', "asc", includeArr)
                .then(function (marketPlaceData) {
                    marketPlaceData = JSON.parse(JSON.stringify(marketPlaceData));
                    return cb(null, marketPlaceData)
                }).catch(function (error) {
                    console.log('Error :::', error);
                    return cb(error);
                });
        },
    }, function (err, results) {
        if (!err) {
            var totalItems = results.orderItems.rows;
            var allMarketPlaces = results.marketPlace.rows;
            var totalPrice = {};
            var defaultShipping = 0;

            totalPrice['grandTotal'] = 0;

            var seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");

            _.forOwn(seperatedItems, function(itemsValue, itemsKey) {
                totalPrice[itemsKey] = {};
                totalPrice[itemsKey]['price'] = 0;
                totalPrice[itemsKey]['shipping'] = 0;
                totalPrice[itemsKey]['total'] = 0;

                for (var i = 0; i < itemsValue.length; i++) {

                    if ((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price) {

                        var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

                        totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
                        totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
                        totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
                    }
                }

                totalPrice['grandTotal'] = totalPrice['grandTotal'] + totalPrice[itemsKey]['total'];
            });

            var result_obj = {
                title: "Global Trade Connect",
                type:'sales-history',
                LoggedInUser: LoggedInUser,
                marketPlaces: results.marketPlace.rows,
                order: results.order,
                orderItems: results.orderItems.rows,
                orderItemsCount: results.orderItems.count,
                seperatedItemsList: seperatedItems,
                totalPriceList: totalPrice,
                orderStatus: orderStatus,
                cartheader: results.cartCounts,
                categories: results.categories,
                bottomCategory: bottomCategory,
                statusCode: statusCode,
                orderItemStatus: orderItemStatus,
                carriersCode:carriersCode
            }
            return res.status(200).render('orderView', result_obj);
        }
        else {
            res.render('orderView', err);
        }
    });
}