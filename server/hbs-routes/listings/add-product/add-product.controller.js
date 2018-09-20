'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const marketplaceTypeCode = require('../../../config/marketplace_type');
const populate = require('../../../utilities/populate');
const vendorPlan = require('../../../config/gtc-plan');
var url = require('url');


export function addProduct(req, res) {

	var categoryModel, countryModel, marketplaceTypeModel, productModel, editProductId;
	var queryObj = {}, LoggedInUser = {}, bottomCategory = {}, productIncludeArr = [];;
	var offset, limit, field, order, type;


    categoryModel = "Category";
    countryModel = "Country";
	marketplaceTypeModel = "MarketplaceType";
	productModel = "Product";

    type = req.params.type;

    offset = 0;
    limit = null;
    field = "id";
    order = "asc";

    LoggedInUser = {};

    if (req.user)
		LoggedInUser = req.user;
		
	if (req.params.id)
		editProductId = req.params.id;

    queryObj['status'] = status["ACTIVE"];

    var queryObjCategory = {
        status: status['ACTIVE']
	};

	productIncludeArr = populate.populateData('Marketplace,ProductMedia,Category,SubCategory,MarketplaceType,Discount,ProductAttribute,Category.CategoryAttribute,Category.CategoryAttribute.Attribute,Country,State,ProductAttribute.Attribute,Discount');

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

            categoryQueryObj['status'] = status["ACTIVE"];

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
        country: function(callback) {
            service.findRows(countryModel, queryObj, offset, limit, field, order)
                .then(function(country) {
                    return callback(null, country.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        marketplaceType: function(callback) {
            service.findRows(marketplaceTypeModel, queryObj, offset, limit, field, order)
                .then(function(marketplaceType) {
                    return callback(null, marketplaceType.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
		},
		editProduct: function(callback){
			service.findIdRow(productModel, editProductId, productIncludeArr)
				.then(function(editProduct) {
					return callback(null, editProduct);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
    }, function(err, results) {
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
		
			let productImages = [], productBaseImage=[];

			if(results.editProduct){
				for(let i=0; i<results.editProduct.ProductMedia.length; i++){
					if(results.editProduct.ProductMedia[i].base_image != 1){
						productImages.push({
							uploadedImage: results.editProduct.ProductMedia[i].url,
							fileName : 'ProductImage.png',
							existing : 'yes'
						})
					}else if(results.editProduct.ProductMedia[i].base_image == 1){
						productBaseImage.push({
							uploadedBaseImage: results.editProduct.ProductMedia[i].url,
							fileName : 'ProductImage.png',
							existing : 'yes'
						})
					}
				}
			}

        if (!err) {
            res.render('vendorNav/listings/add-product', {
                title: "Global Trade Connect",
                categories: results.categories,
                bottomCategory: bottomCategory,
                country: results.country,
                marketplaceType: results.marketplaceType,
                marketplaceTypeCode:marketplaceTypeCode,
                LoggedInUser: LoggedInUser,
                cartheader:results.cartCounts,
                vendorPlan: vendorPlan,
                type: type,
				dropDownUrl: dropDownUrl,
				editProduct: results.editProduct,
				productImages: productImages,
				productBaseImage: productBaseImage
            });
        } else {
            res.render('vendorNav/listings/add-product', err);
        }
    });
}