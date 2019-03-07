const service = require('../api/service');
const sequelize = require('sequelize');
const model = require('../sqldb/model-connect');
const mws = require('mws-advanced');
const config = require('../config/environment');
const moment = require('moment');
const status = require('../config/status');
const marketplace = require('../config/marketplace.js');

module.exports = function (job, done) {
    console.log("Amazon Import Agenda started ...");
    let allAmazonProducts;
    const agendaObj = job.attrs.data;

    amazonRequestReport(agendaObj)
		.then(amazonProducts => {
			allAmazonProducts = amazonProducts;
			return checkAuthorizedToImport(agendaObj, allAmazonProducts);
		}).then(authorizedToImport => {
			console.log("authorizedToImport", authorizedToImport);
			return createAmazonProducts(agendaObj, allAmazonProducts);
		}).then((sucessResp) => {
            console.log("sucessResp", sucessResp);
            done();
		}).catch(importError => {
            console.log("AmazonImportError", importError)
            done(importError);
        });

    function amazonRequestReport(agendaObj){
        mws.init({
            accessKeyId: config.amazonImportConfig.accessKeyId,
            secretAccessKey: config.amazonImportConfig.secretAccessKey,
            merchantId: agendaObj.body.amazon_seller_id,
            region: agendaObj.body.amazon_marketplace,
            authToken: agendaObj.body.amazon_marketplace
        });
        return new Promise((resolve, reject) => {
            (async function() {
                try {
                    const results = await mws.requestAndDownloadReport('_GET_MERCHANT_LISTINGS_DATA_');
                    console.log("RESULTS_ARRIVED", JSON.stringify(results));
                    if(results.length > 0)
                        return resolve(JSON.parse(JSON.stringify(results)));
                    else
                        return reject(resMessage("AMAZON_IMPORT_ERROR_OCCURRED", "No products found in amazon to import"));	
                } catch (err) {
                    console.log('* error', err);
                    return reject(resMessage("AMAZON_IMPORT_ERROR_OCCURRED", err));
                }
            })();
        });
    }
    
    function respAuthMsg(authStatus, allProducts, remainingProductLength){
        return {
            authorizedToImport: authStatus,
            totalAmazonProducts: allProducts,
            vendorRemainingProductLimit: remainingProductLength
          };
    }
    
    function checkAuthorizedToImport(agendaObj, allProducts){
        return new Promise((resolve, reject) => {
            let queryObjProduct = {};
            let queryObjPlanLimit = {};
            let vendorCurrentPlan = agendaObj.user.Vendor.VendorPlans[0];
            let planStartDate = moment(vendorCurrentPlan.start_date, 'YYYY-MM-DD').startOf('day').utc().format("YYYY-MM-DD HH:mm");
            let planEndDate = moment(vendorCurrentPlan.end_date, 'YYYY-MM-DD').endOf('day').utc().format("YYYY-MM-DD HH:mm");
    
            queryObjPlanLimit['plan_id'] = vendorCurrentPlan.plan_id;
            queryObjPlanLimit['status'] = status['ACTIVE'];
    
            queryObjProduct['vendor_id'] = agendaObj.user.Vendor.id;
            queryObjProduct['created_on'] = {
                '$gte': planStartDate,
                '$lte': planEndDate
            }
            service.findOneRow("PlanLimit", queryObjPlanLimit)
              .then(function (planLimit) {
                if (planLimit) {
					var maximumProductLimit;
					//const maximumProductLimit = planLimit.maximum_product;
				
					if(req.body.marketplace_id == marketplace.WHOLESALE || req.body.marketplace_id == marketplace.PUBLIC)
						maximumProductLimit = planLimit.maximum_product;
					else if(req.body.marketplace_id == marketplace.SERVICE)
						maximumProductLimit = planLimit.maximum_services;
					else if(req.body.marketplace_id == marketplace.LIFESTYLE)
						maximumProductLimit = planLimit.maximum_subscription;

                  service.countRows("Product", queryObjProduct)
                    .then(function (existingProductCount) {
                      let remainingProductLength = maximumProductLimit - existingProductCount;
                          if (allProducts.length <= remainingProductLength)
                            return resolve(respAuthMsg(true, allProducts.length, remainingProductLength));  
                        else
                            return reject(resMessage("VENDOR_LIMIT_EXCEEDED", "Vendor Plan Limit exceeded to add these products"));
                    }).catch(function (error) {
                          console.log("Error::::", error);
                          return reject(resMessage("INTERNAL_SERVER_ERROR", "Internal server error occurred while Product lookup"));
                    });
                }
              });
        });
    }
    
    function createProductAndMedia(newProductObj, productMediaObj){
        return new Promise((resolve, reject) => {
            let createdProductObj;
            service.createRow('Product', newProductObj)
                .then((ProductObj) => {
                    productMediaObj['product_id'] = ProductObj.id;
                    createdProductObj = ProductObj;
                    return service.createRow('ProductMedia', productMediaObj)
                }).then((MediaObj) => {
                    resolve({
                        createdProductObj: createdProductObj,
                        createdMediaObj: MediaObj
                    });
                }).catch((createError) => {
                    reject(createError);
                });
        });
    }
    
    function createAmazonProducts(agendaObj, allProducts) {
      return new Promise((resolve, reject) => {
        let createdProductsCount = 0;
        let skippedProductsCount = 0;
    
        function createRecursiveLoop(data, inputlength) {
          if (inputlength >= 0) {
            let currentdata = data[inputlength];
    
            let productQueryObj = {};
            productQueryObj['product_slug'] = string_to_slug(currentdata['item-name']);
            productQueryObj['status'] = status['ACTIVE'];
            productQueryObj['vendor_id'] = agendaObj.user.Vendor.id;
    
            service.findOneRow('Product', productQueryObj, [])
              .then((existingProduct) => {
                  console.log("existingProduct",existingProduct)
                if (!existingProduct) {
                  let newProductObj = {};
                    newProductObj['sku'] = currentdata['seller-sku'];
                    newProductObj['product_name'] = currentdata['item-name'];
                    newProductObj['description'] = currentdata['item-description'];
                    newProductObj['product_slug'] = string_to_slug(currentdata['item-name']);
                    newProductObj['vendor_id'] = agendaObj.user.Vendor.id;
                    newProductObj['status'] = status['ACTIVE'];
                    newProductObj['marketplace_id'] = agendaObj.body.marketplace_id;
                    newProductObj['publish_date'] = new Date();
                    newProductObj['product_category_id'] = agendaObj.body.amazon_category;
				   // newProductObj['quantity_available'] = currentdata.quantity;
				    newProductObj['quantity_available'] = agendaObj.body.amazon_quantity_available;
                    newProductObj['sub_category_id'] = agendaObj.body.amazon_sub_category;
                    newProductObj['price'] = currentdata.price.replace('$', '');
                    newProductObj['product_location'] = agendaObj.user.Vendor.Country.id;
                    newProductObj['city'] = agendaObj.user.Vendor.city;
                    newProductObj['created_on'] = new Date();
                    newProductObj['created_by'] = agendaObj.user.first_name;
                  
                  let productMediaObj = {};
                      productMediaObj['type'] = 1;
                    productMediaObj['status'] = status['ACTIVE'];
                    productMediaObj['url'] = currentdata['image-url'];
                    productMediaObj['base_image'] = 1;
                    productMediaObj['created_on'] = new Date();
                    productMediaObj['created_by'] = agendaObj.user.first_name;
    
                  createProductAndMedia(newProductObj, productMediaObj)
                      .then((createdProductObj) => {
                            createdProductsCount = createdProductsCount + 1;
                            inputlength = inputlength - 1;
                            createRecursiveLoop(data, inputlength);
                      }).catch((errProductObj) => {
                            inputlength = inputlength - 1;
                            createRecursiveLoop(data, inputlength);
                    });
                } else {
                    skippedProductsCount = skippedProductsCount + 1;
                    inputlength = inputlength - 1;
                    createRecursiveLoop(data, inputlength);
                }
              })
          } else {
            resolve({
                productCreated: true,
                skippedProductsCount: skippedProductsCount,
                createdProductsCount: createdProductsCount
            });
          }
    
        }
        let inputlength = allProducts.length - 1
        createRecursiveLoop(allProducts, inputlength);
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
    
    function resMessage(message, messageDetails) {
        return {
            message: message,
            messageDetails: messageDetails
        };
    }
    
}
