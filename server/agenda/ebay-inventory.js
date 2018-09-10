'use strict';

const request = require('request');
const parser = require('xml2json');
const service = require('../api/service');
const status = require('../config/status');
const config = require('../config/environment');
const marketplace = require('../config/marketplace.js');

module.exports = async function(job, done) {
	var products = [];
	var otherCategoryId = 39;
	var otherSubCategoryId = 730;
	var productEntity = "Product";
	var productImageEntity = "ProductMedia";

	const ebayCredentials = job.attrs.data.ebayCredentials;
	const user = job.attrs.data.user;

	try {
		callEbayMethod(1);

		async function callEbayMethod(pageNumber) {
			const sellerListResponse = await getEbaySellerItems(ebayCredentials, pageNumber);
			if (sellerListResponse.GetSellerListResponse.HasMoreItems == 'true') {
				pageNumber += 1;
				products = products.concat(sellerListResponse.GetSellerListResponse.ItemArray.Item);
				callEbayMethod(pageNumber);
			} else {
				products = products.concat(sellerListResponse.GetSellerListResponse.ItemArray.Item);
				await Promise.all(products.map(async (item) => {
					var productObj = {};
					productObj['sku'] = item.ItemID;
					productObj['product_name'] = item.Title;
					productObj['product_slug'] = await string_to_slug(item.Title);
					productObj['vendor_id'] = user.Vendor.id;
					productObj['status'] = status['ACTIVE'];
					productObj['marketplace_id'] = marketplace['PUBLIC'];
					productObj['publish_date'] = new Date();
					productObj['product_category_id'] = otherCategoryId;
					productObj['quantity_available'] = item.Quantity;
					productObj['sub_category_id'] = otherSubCategoryId;
					productObj['price'] = item.SellingStatus.CurrentPrice.$t;
					productObj['product_location'] = user.Vendor.base_location;
					productObj['state_id'] = user.Vendor.province_id;
					productObj['city'] = user.Vendor.city;
					productObj['created_on'] = new Date();

					const productResponse = await service.upsertRecord(productEntity, productObj, {
						vendor_id: user.Vendor.id,
						sku: item.ItemID
					});
					const product = await productResponse.toJSON();
					if (product.last_updated_on == null) {
						if (Array.isArray(item.PictureDetails.PictureURL) && item.PictureDetails.PictureURL.length > 0) {
							await Promise.all(item.PictureDetails.PictureURL.map(async (image, i) => {
								var productImageObj = {};
								if (i == 0) {
									productImageObj['product_id'] = product.id;
									productImageObj['type'] = 1;
									productImageObj['base_image'] = 1;
									productImageObj['url'] = image;
									productImageObj['status'] = status['ACTIVE'];
									productImageObj['base_image'] = 1;
									productImageObj['created_on'] = new Date();
								} else {
									productImageObj['product_id'] = product.id;
									productImageObj['type'] = 1;
									productImageObj['base_image'] = 0;
									productImageObj['url'] = image;
									productImageObj['base_image'] = 1;
									productImageObj['status'] = status['ACTIVE'];
									productImageObj['created_on'] = new Date();
								}
								const productImage = await service.createRow(productImageEntity, productImageObj);
							}));
						} else {
							var productImageObj = {};
							productImageObj['product_id'] = product.id;
							productImageObj['type'] = 1;
							productImageObj['base_image'] = 1;
							productImageObj['url'] = item.PictureDetails.PictureURL;
							productImageObj['base_image'] = 1;
							productImageObj['status'] = status['ACTIVE'];
							productImageObj['created_on'] = new Date();
							const productImage = await service.createRow(productImageEntity, productImageObj);
						}
					}
				}));
			}
		}
		done();
	} catch (error) {
		console.log("Agenda import Ebay Error:::", error);
		done();
		return error;
	}
};

function getEbaySellerItems(ebayObject, pageNumber) {
	return new Promise(function(resolve, reject) {
		var options = {
			method: 'POST',
			url: 'https://api.ebay.com/ws/api.dll',
			headers: {
				'X-EBAY-API-SITEID': 0,
				'X-EBAY-API-COMPATIBILITY-LEVEL': 967,
				'X-EBAY-API-CALL-NAME': "GetSellerList",
				'X-EBAY-API-IAF-TOKEN': ebayObject.accessToken
			},
			body: `<?xml version="1.0" encoding="utf-8"?>
					<GetSellerListRequest xmlns="urn:ebay:apis:eBLBaseComponents">    
						<ErrorLanguage>en_US</ErrorLanguage>
						<WarningLevel>High</WarningLevel>
					  	<GranularityLevel>Coarse</GranularityLevel>
					  	<StartTimeFrom>${ebayObject.startTimeFrom}</StartTimeFrom> 
					  	<StartTimeTo>${ebayObject.startTimeTo}</StartTimeTo> 
					  	<IncludeWatchCount>true</IncludeWatchCount> 
					  	<Pagination> 
					    	<EntriesPerPage>${config.ebay.entriesPerPage}</EntriesPerPage>
					    	<PageNumber>${pageNumber}</PageNumber>
					  	</Pagination>
					</GetSellerListRequest>`
		};
		request(options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				const parsedJSON = parser.toJson(body);
				resolve(JSON.parse(parsedJSON));
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