'use strict';

const sequelize = require('sequelize');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const Sequelize_Instance = require('../../sqldb/index');
const RawQueries = require('../../raw-queries/sql-queries');
const config = require('../../config/environment');
const _ = require('lodash');
const mv = require('mv');
const fs = require('fs');

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
			console.log('Error:::', error);
			reject(error);
		});
	});
}

export function findAllRows(modelName, includeArr, queryObj, offset, limit, field, order){
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
					console.log('Error:::', error);
					return reject(error);
				});
			} else {
				result.count = 0;
				result.rows = convertRowsJSON;
				return resolve(result);
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
	});
}

export function countRows(modelName, queryObj, includeArr) {
	return new Promise((resolve, reject) => {
		model[modelName].count({
			where: queryObj,
			include: includeArr
		}).then(function(count) {
			resolve(count);
		}).catch(function(error) {
			console.log('Error:::', error);
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
			console.log('Error:::', error);
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
			console.log('Error:::', error);
			reject(error);
		});
	});
}

export function findAllRow(modelName, queryObj, includeArr) {
	return new Promise((resolve, reject) => {
		model[modelName].findAll({
			include: includeArr,
			where: queryObj
		}).then(function(row) {
			if (row) {
				resolve(row);
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			console.log('Error:::', error);
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
			console.log('Error:::', error);
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
				console.log('Error:::', error);
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
				console.log('Error:::', error);
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
			console.log('Error:::', error);
			reject(error);
		})
	})
}

export function updateRecordNew(modelName, bodyParams, queryObj) {
	return new Promise((resolve, reject) => {
		model[modelName].update(bodyParams, {
			where: queryObj,
			individualHooks: true
		}).then(function([rowsUpdate, [updatedRow]]) {
			if (updatedRow) {
				return resolve(updatedRow.toJSON());
			} else {
				return resolve(null);
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			return reject(error);
		})
	});
}

export function updateManyRecord(modelName, bodyParams, queryObj) {
	return new Promise((resolve, reject) => {
		model[modelName].update(bodyParams, {
			where: queryObj,
			individualHooks: true
		}).then(function(rows) {
			if (rows[0] > 0) {
				resolve(rows);
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			console.log('Error:::', error);
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
			console.log('Error:::', error);
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
			console.log('Error:::', error);
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
			console.log('Error:::', error);
			reject(error);
		});
	});
}

export function upsertRecord(modelName, bodyParams, queryObj) {
	return model[modelName].findOne({
		where: queryObj
	}).then((exists) => {
		if (exists) {
			bodyParams['last_updated_on'] = new Date();
			return exists.update(bodyParams);
		} else {
			bodyParams['created_on'] = new Date();
			return model[modelName].create(bodyParams);
		}
	});
}

export function upsertRow(modelName, bodyParams, queryObj, audit) {
	return model[modelName].findOne({
		where: queryObj
	}).then((exists) => {
		if (exists) {
			bodyParams['last_updated_by'] = audit ? audit : 'Administrator';
			bodyParams['last_updated_on'] = new Date();
			return exists.update(bodyParams);
		} else {
			bodyParams['created_by'] = audit ? audit : 'Administrator';
			bodyParams['created_on'] = new Date();
			return model[modelName].create(bodyParams);
		}
	});
}

export function destroyRecord(modelName, id) {
	return new Promise((resolve, reject) => {
		model[modelName].destroy({
			where: {
				id: id
			}
		}).then((row) => {
			if (row > 0) {
				resolve(row);
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		})
	});
}

export function destroyManyRecord(modelName, ids) {
	return new Promise((resolve, reject) => {
		model[modelName].destroy({
			where: {
				id: ids
			}
		}).then((row) => {
			if (row > 0) {
				resolve(row);
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		})
	});
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

export function categoryAndSubcategoryCount() {
	return new Promise((resolve, reject) => {
		Sequelize_Instance.query(RawQueries.categoryAndSubcategoryCount(), {
			model: model['product'],
			type: Sequelize_Instance.QueryTypes.SELECT
		}).then(resultObj => {
			resultObj = JSON.parse(JSON.stringify(resultObj));
			let groupByCategories = _.groupBy(resultObj, "product_category_id");
			let categoryObj = [],
				totalCategoryProducts = 0;

			for (var i = 0; i < resultObj.length; i++) {
				let tempCategory = groupByCategories[resultObj[i].product_category_id];
				totalCategoryProducts = totalCategoryProducts + parseInt(resultObj[i].subCategoryCount);
				let obj = {
					"product_category_id": tempCategory[0].product_category_id,
					"category_name": tempCategory[0].category_name,
					"categoryCount": tempCategory[0].categoryCount,
				}
				let index = categoryObj.findIndex(x => x.product_category_id == obj.product_category_id);
				if (index === -1)
					categoryObj.push(obj);
			}

			resolve({
				categoryObj: categoryObj,
				subCategoryObj: resultObj,
				totalCategoryProducts: totalCategoryProducts
			});

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
					console.log("Error::",error);
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
					console.log('Error:::', error);
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
			attributes: ['id', 'price', 'shipping_cost', 'moq'],
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
						if (itemsValue[i].quantity) {
							var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

							totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
							totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
							totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
						} else {
							var calulatedSum = (itemsValue[i].Product.moq * itemsValue[i].Product.price);

							totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
							totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
							totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
						}
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
					console.log('Error:::', error);
					return reject(error);
				});
			} else {
				result.count = 0;
				result.rows = convertRowsJSON;
				return resolve(result);
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
	});
}
// Not use for limit getallfindrow query ends//
export function move(copyFrom, moveTo) {
	return new Promise((resolve, reject) => {
		mv(copyFrom, moveTo, {
			clobber: true,
			mkdirp: true
		}, function(error) {
			if (!error) {
				return resolve(true);
			} else {
				return reject(error);
			}
		});
	});
}
export function imgDelete(imgPath) {
	imgPath = config.images_base_path + imgPath;
	return new Promise((resolve, reject) => {
		  try{
		  	fs.unlinkSync(imgPath);
		  	resolve(true);
			}
			catch(err){
				return reject(err);
			}
		});
}