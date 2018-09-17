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

export async function vendorCountByMarketplace() {
	return new Promise((resolve, reject) => {
		Sequelize_Instance.query(RawQueries.vendorCountByMarkerplace(), {
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
