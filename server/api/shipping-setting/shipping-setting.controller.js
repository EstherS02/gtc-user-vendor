'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
var async = require('async');


export function updateVendor(req, res) {
	var modelName = 'Vendor';
	var vendor_id = req.user.Vendor.id;
	var country_id = req.body.country_id;
	// console.log(country_id);
	var bodyParam = {
		base_location: country_id,
		last_updated_on: new Date()
	};
	service.updateRow(modelName, bodyParam, vendor_id).then(function(response) {
		if (response) {
			res.status(200).send(response);
			return;
		} else {
			res.status(404).send("Unable to delete");
			return;
		}
	});
}
export function addCountry(req, res) {
	var modelName = 'VendorShippingLocation';
	var vendor_id = req.user.Vendor.id;
	var data = JSON.parse(req.body.country_id);
	var i;
	var queryObj = {};
	var includeArr = [];
	if (req.user.Vendor.id) {

		queryObj.vendor_id = vendor_id;
		data.forEach(function(element) {
			var bodyParams = {};
			bodyParams.vendor_id = vendor_id;
			bodyParams.country_id = element;
			bodyParams.status = 1;
			queryObj.country_id = element;
			model[modelName].findOne({
				where: queryObj
			}).then(function(result) {
				if (result) {
					service.updateRow(modelName, bodyParams, result.id)
						.then(function(response) {
							return;
						});

				} else {
					bodyParams.created_on = new Date();
					service.createRow(modelName, bodyParams).then(function(response) {
						return;
					});
				}
			});
		});
		return res.status(200).send("success");
	} else {
		return res.status(404).send("Invalid Entry");
	}


}

export function removeCountry(req, res) {
	var modelName = 'VendorShippingLocation';
	var vendor_id = req.user.Vendor.id;
	var data = JSON.parse(req.body.country_id);
	var i;
	var queryObj = {};
	var includeArr = [];
	if (req.user.Vendor.id) {

		queryObj.vendor_id = vendor_id;
		data.forEach(function(element) {
			var bodyParams = {};
			bodyParams.vendor_id = vendor_id;
			bodyParams.country_id = element;
			bodyParams.status = 0;
			queryObj.country_id = element;
			model[modelName].findOne({
				where: queryObj
			}).then(function(result) {
				if (result) {
					service.updateRow(modelName, bodyParams, result.id)
						.then(function(response) {
							return;
						});

				}
			});
		});
		return res.status(200).send("success");
	} else {
		return res.status(404).send("Invalid Entry");
	}

}