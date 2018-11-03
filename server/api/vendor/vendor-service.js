'use strict';

var async = require("async");
const sequelize = require('sequelize');
const service = require('../service');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const Sequelize_Instance = require('../../sqldb/index');
const RawQueries = require('../../raw-queries/sql-queries');
const roles = require('../../config/roles');
const model = require('../../sqldb/model-connect');

export function orderVendorFollowers(modelName, querObj, includeArray, groupBy) {
	return new Promise((resolve, reject) => {
		model[modelName].findAll({
			where: querObj,
			include: includeArray,
			group: [groupBy]
		}).then((rows) => {
			const response = JSON.parse(JSON.stringify(rows));
			return resolve(response);
		}).catch((error) => {
			return reject(error);
		});
	});
}

export async function vendorCountByCountry(params) {
	return new Promise((resolve, reject) => {
		if (params) {
			Sequelize_Instance.query(RawQueries.countryCountForVendor(params), {
				model: model['Country'],
				type: Sequelize_Instance.QueryTypes.SELECT
			}).then((results) => {
				resolve(results)
			}).catch(function(error) {
				reject(error);
			});
		} else {
			resolve()
		}
	});
}

export async function vendorCountByMarketplace(params) {
	return new Promise((resolve, reject) => {
		Sequelize_Instance.query(RawQueries.vendorCountByMarkerplace(params), {
			model: model['Marketplace'],
			type: Sequelize_Instance.QueryTypes.SELECT
		}).then((results) => {
			resolve(results)
		}).catch(function(error) {
			reject(error);
		});
	});
}

export async function vendorCountByCountryForHome() {
	return new Promise((resolve, reject) => {
		Sequelize_Instance.query(RawQueries.countryCountForVendorHomepage(), {
			model: model['Country'],
			type: Sequelize_Instance.QueryTypes.SELECT
		}).then((results) => {
			resolve(results)
		}).catch(function(error) {
			reject(error);
		});
	});
}

//vendor profile page
export async function vendorProductCountForFilter(params) {
	return new Promise((resolve, reject) => {
		if (params) {
			Sequelize_Instance.query(RawQueries.vendorFilterCatogoryCount(params), {
				model: model['Product'],
				type: Sequelize_Instance.QueryTypes.SELECT
			}).then((results) => {
				resolve(results)
			}).catch(function(error) {
				reject(error);
			});
		} else {
			resolve()
		}
	});
}