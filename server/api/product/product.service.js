'use strict';

var async = require("async");
const service = require('../service');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const roles = require('../../config/roles');
const model = require('../../sqldb/model-connect');

export function importWooCommerceProducts(product, req) {
	var productQueryObj = {};
	var newProductObj = {};
	var category_id;
	productQueryObj['sku'] = product.sku;
	productQueryObj['status'] = status['ACTIVE'];

	if (req.user.role === roles['VENDOR']) {
		productQueryObj['vendor_id'] = req.user.Vendor.id
	}

	return new Promise((resolve, reject) => {
		return service.findOneRow('Product', productQueryObj, [])
			.then((existingProduct) => {
				if (!existingProduct) {
					return service.findOneRow('Category', {
						name: product.categories[0].name,
						status: status['ACTIVE']
					}, []);
				} else {
					return Promise.reject(true);
				}
			}).then((existingCategory) => {
				if (!existingCategory) {
					return service.findOneRow('Category', {
						name: "OTHERS",
						status: status['ACTIVE']
					}, []);
				} else {
					category_id = existingCategory.id;
				}
			}).then((othersCategory) => {
				if (othersCategory) {
					category_id = othersCategory.id;
					newProductObj['sku'] = product.sku;
					newProductObj['product_name'] = product.name;
					newProductObj['product_slug'] = product.slug;
					newProductObj['vendor_id'] = req.user.Vendor.id;
					newProductObj['status'] = status['ACTIVE'];
					newProductObj['marketplace_id'] = marketplace['PUBLIC'];
					newProductObj['publish_date'] = new Date();
					newProductObj['product_category_id'] = category_id;
					newProductObj['quantity_available'] = 0;
					newProductObj['sub_category_id'] = 730;
					newProductObj['price'] = product.price;
					newProductObj['description'] = product.description;
					newProductObj['product_location'] = req.user.Vendor.Country.id;
					newProductObj['created_on'] = new Date();
					return service.createRow('Product', newProductObj);
				} else {

				}
			}).then((newProduct) => {
				var productMedias = [];
				for (let i = 0; i < product.images.length; i++) {
					var productMediaObj = {
						product_id: newProduct.id,
						type: 1,
						status: status['ACTIVE'],
						url: product.images[i].src,
						base_image: 1,
						created_on: new Date(),
						created_by: req.user.first_name
					}
					productMedias.push(service.createRow('ProductMedia', productMediaObj));
				}
				return Promise.all(productMedias);
			}).then((result) => {
				resolve("success");
			}).catch(function(error) {
				reject(error);
			});
	});
}