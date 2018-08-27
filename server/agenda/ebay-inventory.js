'use strict';

const request = require('request');
const service = require('../api/service');
const status = require('../config/status');
const config = require('../config/environment');
const marketplace = require('../config/marketplace.js');

module.exports = async function(job, done) {
	var products = [];
	var otherCategoryId = 39;
	var otherSubCategoryId = 730;
	let nextURL = "/?limit=2&offset=0";

	const headers = job.attrs.data.headers;
	const user = job.attrs.data.user;
	const size = job.attrs.data.size;

	try {
		callEbayMethod(0, nextURL);

		async function callEbayMethod(sizeCount, nextURL) {
			sizeCount += 1;
			if (sizeCount <= size) {
				var productResponse = await getEbayInventoryItems(headers, nextURL);
				if (productResponse.next) {
					nextURL = productResponse.next;
					callEbayMethod(sizeCount, nextURL);
				}
				products.concat(productResponse.inventoryItems);
			}
			const productRsp = await Promise.all(products.map(async (obj) => {
				var newProductObj = {};
				const existingProduct = await service.findOneRow('Product', {
					sku: obj.sku,
					status: status['ACTIVE'],
					vendor_id: user.Vendor.id
				}, []);
				if (!existingProduct) {
					newProductObj['sku'] = obj.sku;
					newProductObj['product_name'] = obj.product.title;
					newProductObj['product_slug'] = await string_to_slug(obj.product.title);
					newProductObj['vendor_id'] = user.Vendor.id;
					newProductObj['status'] = status['ACTIVE'];
					newProductObj['marketplace_id'] = marketplace['PUBLIC'];
					newProductObj['publish_date'] = new Date();
					newProductObj['product_category_id'] = otherCategoryId;
					newProductObj['quantity_available'] = obj.availability.shipToLocationAvailability.quantity;
					newProductObj['sub_category_id'] = otherSubCategoryId;
					newProductObj['price'] = 0;
					newProductObj['description'] = obj.product.description;
					newProductObj['product_location'] = user.Vendor.Country.id;
					newProductObj['city'] = user.Vendor.city;
					newProductObj['city_id'] = user.Vendor.city_id;
					newProductObj['created_on'] = new Date();
					var newProduct = await service.createRow('Product', newProductObj);
					var images = obj.product.imageUrls;
					await Promise.all(images.map(async (img, i) => {
						var productMediaObj = {};
						if (i == 0) {
							productMediaObj['product_id'] = newProduct.id;
							productMediaObj['type'] = 1;
							productMediaObj['status'] = status['ACTIVE'];
							productMediaObj['url'] = img;
							productMediaObj['base_image'] = 1;
							productMediaObj['created_on'] = new Date();
							productMediaObj['created_by'] = user.first_name;
						} else {
							productMediaObj['product_id'] = newProduct.id;
							productMediaObj['type'] = 1;
							productMediaObj['status'] = status['ACTIVE'];
							productMediaObj['url'] = img;
							productMediaObj['base_image'] = 0;
							productMediaObj['created_on'] = new Date();
							productMediaObj['created_by'] = user.first_name;
						}
						const response = await service.createRow('ProductMedia', productMediaObj);
						return response;
					}));
				}
			}));
			return productRsp;
		}
		done();
	} catch (error) {
		console.log("Agenda Import Ebay Error:::", error);
		done();
		return error;
	}
};

function getEbayInventoryItems(headers, nextURL) {
	return new Promise(function(resolve, reject) {
		request.get({
			url: config.ebay.inventoryItems + nextURL,
			headers: headers,
			json: true
		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				resolve(body);
			} else {
				reject(error);
			}
		});
	});
}

function string_to_slug(str) {
	str = str.replace(/^\s+|\s+$/g, ''); // trim
	str = str.toLowerCase();

	// remove accents, swap ñ for n, etc
	var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
	var to = "aaaaeeeeiiiioooouuuunc------";
	for (var i = 0, l = from.length; i < l; i++) {
		str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
	}

	str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
		.replace(/\s+/g, '-') // collapse whitespace and replace by -
		.replace(/-+/g, '-'); // collapse dashes

	return str;
}