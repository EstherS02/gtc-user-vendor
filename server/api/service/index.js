'use strict';

const status = require('../../config/status');
const position = require('../../config/position');
const model = require('../../sqldb/model-connect');
const sequelize = require('sequelize');
const Sequelize_Instance = require('../../sqldb/index');
const RawQueries = require('../../raw-queries/sql-queries');
const _ = require('lodash');

export function findRows(modelName, queryObj, offset, limit, field, order, includeArr) {
    return new Promise((resolve, reject) => {
        model[modelName].findAndCountAll({
            where: queryObj,
            include: includeArr,
            offset: offset,
            limit: limit,
            order: [
                [field, order]
            ]
        }).then(function(rows) {
            resolve(rows);
        }).catch(function(error) {
            reject(error);
        });
    });
}

export function findAllRows(modelName, includeArr, queryObj, offset, limit, field, order) {
    var result = {};
    return new Promise((resolve, reject) => {
        model[modelName].findAll({
            include: includeArr,
            where: queryObj,
            offset: offset,
            limit: limit,
            order: [
                [field, order]
            ]
        }).then(function(rows) {
            var convertRowsJSON = [];
            if (rows.length > 0) {
                convertRowsJSON = JSON.parse(JSON.stringify(rows));
                return model[modelName].count({
                    where: queryObj
                }).then(function(count) {
                    result.count = count;
                    result.rows = convertRowsJSON;
                    return resolve(result);
                }).catch(function(error) {
                    return reject(error);
                });
            } else {
                result.count = 0;
                result.rows = convertRowsJSON;
                return resolve(result);
            }
        }).catch(function(error) {
            reject(error);
        });
    });
}

export function countRows(modelName, queryObj) {
    return new Promise((resolve, reject) => {
        model[modelName].count({
            where: queryObj
        }).then(function(count) {
            resolve(count);
        }).catch(function(error) {
            reject(error);
        });
    });
}

export function findIdRow(modelName, id, includeArr) {
    return new Promise((resolve, reject) => {
        model[modelName].find({
            where: {
                id: id
            },
            include: includeArr
        }).then(function(row) {
            if (row) {
                resolve(row.toJSON());
            } else {
                resolve(null);
            }
        }).catch(function(error) {
            reject(error);
        });
    });
}

export function findRow(modelName, queryObj, includeArr) {
    return new Promise((resolve, reject) => {
        model[modelName].find({
            include: includeArr,
            where: queryObj
        }).then(function(row) {
            if (row) {
                resolve(row);
            } else {
                resolve(null);
            }
        }).catch(function(error) {
            reject(error);
        });
    });
}

export function findOneRow(modelName, queryObj, includeArr) {
    return new Promise((resolve, reject) => {
        model[modelName].findOne({
            include: includeArr,
            where: queryObj
        }).then(function(row) {
            if (row) {
                resolve(row.toJSON());
            } else {
                resolve(null);
            }
        }).catch(function(error) {
            reject(error);
        });
    });
}

export function createRow(modelName, bodyParams) {
    return new Promise((resolve, reject) => {
        model[modelName].create(bodyParams)
            .then(function(row) {
                if (row) {
                    resolve(row.toJSON());
                } else {
                    resolve(null);
                }
            }).catch(function(error) {
                reject(error);
            });
    })
}

export function createBulkRow(modelName, bodyParams) {
    return new Promise((resolve, reject) => {
        model[modelName].bulkCreate(bodyParams, {
                individualHooks: true
            })
            .then(function(row) {
                if (row) {
                    resolve(row);
                } else {
                    resolve(null);
                }
            }).catch(function(error) {
                reject(error);
            });
    })
}

export function updateRecord(modelName, bodyParams, queryObj) {
    return new Promise((resolve, reject) => {
        model[modelName].update(bodyParams, {
            where: queryObj,
            individualHooks: true
        }).then(function(row) {
            if (row) {
                resolve(row[1][0].toJSON());
            } else {
                resolve(null);
            }
        }).catch(function(error) {
            reject(error);
        })
    })
}

export function updateRow(modelName, bodyParams, id) {
    return new Promise((resolve, reject) => {
        model[modelName].update(bodyParams, {
            where: {
                id: id
            }
        }).then(function(row) {
            if (row) {
                resolve(row);
            } else {
                resolve(null);
            }
        }).catch(function(error) {
            reject(error);
        })
    })
}

export function destroyManyRow(modelName, ids) {
    return new Promise((resolve, reject) => {
        model[modelName].update({
            status: status["DELETED"],
            deleted_at: new Date()
        }, {
            where: {
                id: ids
            }
        }).then(function(rows) {
            if (rows[0] > 0) {
                resolve(rows);
            } else {
                resolve(null);
            }
        }).catch(function(error) {
            reject(error);
        });
    });
}

export function destroyRow(modelName, id) {
    return new Promise((resolve, reject) => {
        model[modelName].update({
            status: status["DELETED"],
            deleted_at: new Date()
        }, {
            where: {
                id: id
            },
            returning: true,
            plain: true
        }).then(function(row) {
            if (row) {
                resolve(row);
            } else {
                resolve(null);
            }
        }).catch(function(error) {
            reject(error);
        });
    });
}

export function upsertRecord(modelName, bodyParams, queryObj) {
    return model[modelName].findOne({
        where: queryObj
    }).then((exists) => {
        if (exists) {
            return exists.update(bodyParams);
        } else {
            return model[modelName].create(bodyParams);
        }
    });
}

export function upsertRow(modelName, data) {
    return new Promise((resolve, reject) => {
        model[modelName].upsert(data)
            .then(function(row) {
                resolve(row);
            }).catch(function(error) {
                reject(error);
            })
    })
}


export function geoLocationFetch(lat, lng) {
    return new Promise((resolve, reject) => {
        Sequelize_Instance.query(RawQueries.geoLocateDistance(lat, lng), {
            model: model['Vendor']
        }).then(geoLocationObj => {
            resolve(JSON.parse(JSON.stringify(geoLocationObj)));
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        });
    });
}

export function getCategory(categoryQueryObj, productCountQueryParames) {
    return new Promise((resolve, reject) => {
        var result = {};
        model['Category'].findAll({
            where: categoryQueryObj,
            include: [{
                model: model['SubCategory'],
                where: categoryQueryObj,
                include: [{
                    model: model['Product'],
                    where: productCountQueryParames,
                    attributes: [],
                    required: false
                }],
                attributes: ['id', 'category_id', 'name', 'code']
            }, {
                model: model['Product'],
                where: productCountQueryParames,
                attributes: ['id'],
                required: false
            }],
            attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
            group: ['SubCategories.id']
        }).then(function(results) {
            if (results.length > 0) {
                model['Product'].count({
                    where: productCountQueryParames
                }).then(function(count) {
                    result.count = count;
                    result.rows = JSON.parse(JSON.stringify(results));

                    resolve(result);
                }).catch(function(error) {

                    reject(error);
                });
            } else {
                result.count = 0;
                result.rows = [];
                resolve(result);
            }
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        })
    })

}
export function getMarketPlaceTypes(marketplaceTypeQueryObj, productCountQueryParames) {
    return new Promise((resolve, reject) => {
        var result = {};
        model['MarketplaceType'].findAll({
            where: marketplaceTypeQueryObj,
            include: [{
                model: model['Product'],
                where: productCountQueryParames,
                attributes: [],
                required: false
            }],
            attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
            group: ['MarketplaceType.id']
        }).then(function(results) {
            if (results.length > 0) {
                model['Product'].count({
                    where: productCountQueryParames
                }).then(function(count) {
                    result.count = count;
                    result.rows = JSON.parse(JSON.stringify(results));
                    resolve(result);
                }).catch(function(error) {
                    reject(error);
                });
            } else {
                result.count = 0;
                result.rows = [];
                resolve(result);
            }
        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        })
    })
}

export function cartHeader(user) {
    var queryObj = {};
    let includeArr = [];

    queryObj['user_id'] = user.id;

    queryObj['status'] = {
        '$eq': status["ACTIVE"]
    }
    return model["Cart"].findAndCountAll({
        where: queryObj,
        include: [{
            model: model["Product"],
            attributes: ['id', 'price', 'shipping_cost'],
            include: [{
                model: model["Marketplace"]
            }, {
                model: model["Country"]
            }]
        }]
    }).then(function(data) {
        var result = JSON.parse(JSON.stringify(data));
        if (result) {
            var cartheader = {};
            cartheader['totalPrice'] = 0;
            cartheader['cartItemsCount'] = result.count;
            var totalItems = result.rows;
            var totalPrice = {};
            var defaultShipping = 0;
            var marketplaceCount = {}
            marketplaceCount['PWM'] = 0;
            marketplaceCount['PM'] = 0;
            marketplaceCount['SM'] = 0;
            marketplaceCount['LM'] = 0;
            totalPrice['grandTotal'] = 0;
            var seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");
            _.forOwn(seperatedItems, function(itemsValue, itemsKey) {
                totalPrice[itemsKey] = {};
                totalPrice[itemsKey]['price'] = 0;
                totalPrice[itemsKey]['total'] = 0;
                totalPrice[itemsKey]['shipping'] = 0;

                for (var i = 0; i < itemsValue.length; i++) {

                    marketplaceCount[itemsKey] = marketplaceCount[itemsKey] + 1;
                    if ((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price) {
                        var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

                        totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
                        totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
                        totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
                    }
                }

                totalPrice['grandTotal'] = totalPrice['grandTotal'] + totalPrice[itemsKey]['total'];
            });
            cartheader['totalPrice'] = totalPrice;
            cartheader['marketplaceCount'] = marketplaceCount;
            return cartheader;
        }
    });
}

// Not use for limit getallfindrow query starts//
export function getAllFindRow(modelName, includeArr, queryObj, field, order) {
    var result = {};
    return new Promise((resolve, reject) => {
        model[modelName].findAll({
            include: includeArr,
            where: queryObj,
            order: [
                [field, order]
            ]
        }).then(function(rows) {
            var convertRowsJSON = [];
            if (rows.length > 0) {
                convertRowsJSON = JSON.parse(JSON.stringify(rows));
                return model[modelName].count({
                    where: queryObj
                }).then(function(count) {
                    result.count = count;
                    result.rows = convertRowsJSON;
                    return resolve(result);
                }).catch(function(error) {
                    return reject(error);
                });
            } else {
                result.count = 0;
                result.rows = convertRowsJSON;
                return resolve(result);
            }
        }).catch(function(error) {
            reject(error);
        });
    });
}
// Not use for limit getallfindrow query ends//