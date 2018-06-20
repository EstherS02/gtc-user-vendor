'use strict';

const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');
const sequelize = require('sequelize');
const marketplace = require('../../config/marketplace');
const async = require('async');
const _ = require('lodash');


export function GetProductDetails(req, res) {
    var queryObj = {};
    var includeArr = [];
    var LoggedInUser = {};


    if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
        LoggedInUser = req.gtcGlobalUserObj;
    }

    if(req.params.product_id)
        queryObj['id'] = req.params.product_id;

    if(req.params.product_slug)
        queryObj['product_slug'] = req.params.product_slug;

        queryObj['status'] = status["ACTIVE"];

    //includeArr = populate.populateData("Vendor,Marketplace,MarketplaceType,Category,SubCategory,Country,State")

    return model["Product"].findOne({
        where: queryObj,
        include: [
            { model: model["Vendor"] },
            { model: model["Marketplace"] },
            { model: model["MarketplaceType"] },
            { model: model["Category"] },
            { model: model["SubCategory"] },
            { model: model["Country"] },
            { model: model["State"] },
            { model: model["Review"], 
                include : [
                    { model: model["User"],
                    attributes: {
                        exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
                    }
                }
                ]
            },
            {
                model: model["ProductMedia"], 
                where: {
                    status : {
                        '$eq': status["ACTIVE"]
                    }
                }
        }],
        order: [
            [ model["ProductMedia"], 'base_image', 'DESC'],
            [ model["Review"], 'created_on', 'DESC']
        ]
    }).then(function(product) {
            if (product) {


            var productsList = JSON.parse(JSON.stringify(product));

            let productReviewsList = _.groupBy(productsList.Reviews, "rating");


                res.render('product-view', {
                    title: "Global Trade Connect",
                    product: productsList,
                    productReviewsList: productReviewsList,
                    LoggedInUser: LoggedInUser
                });

            } else {
                res.render('product-view', {
                    title: "Global Trade Connect"
                });
            }
        })
        .catch(function(error) {
            console.log('Error:::', error);
            res.render('product-view', error);
        });
}


export function productView(req, res) {
    //old code

    let searchObj = {}

    if (req.params.product_id)
        searchObj["id"] = req.params.product_id;

    if (req.params.product_slug)
        searchObj["product_slug"] = req.params.product_slug;

    service.findOneRow('Product', searchObj)
        .then(function(productDetails) {
            res.render('productView', {
                title: 'Global Trade Connect',
                productDetails: productDetails
            });
        }).catch(function(error) {
            console.log('Error :::', error);
            res.render('productView', error)
        });
}



export function GetProductReview(req, res){
	var queryObj = {};
    var includeArr = [];
    var LoggedInUser = {};
    var queryPaginationObj = {};
    var queryParams = {};
    var sub_category;
    var marketplace_id;
    //pagination 
	var page;
	var offset;
	var order;
	var limit;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 5;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	delete req.query.page;
	var field = "id";

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;
	var maxSize;
	// End pagination
	var productModel = 'Product';

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
        LoggedInUser = req.gtcGlobalUserObj;
    }

    if(req.params.product_id)
        queryParams['id'] = req.params.product_id;


    if(req.params.product_slug)
        queryParams['product_slug'] = req.params.product_slug;

        queryObj['status'] = status["ACTIVE"];
    var includeArr = [];

async.series({ 
        Product: function(callback) {
           var includeArr1 = [{
                model: model["ProductMedia"], 
                where: {
                    status : {
                        '$eq': status["ACTIVE"]
                    }
                }
        	}];
           var id = req.params.product_id;
            service.findRow(productModel, id,includeArr1)
                .then(function(product) {
                	sub_category = product.sub_category_id;
                	marketplace_id = product.marketplace_id;
                    return callback(null, product);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        Review: function(callback) {
        	var reviewModel = "Review";
        	var queryObj1 = {
        		product_id :req.params.product_id,
        		status : status["ACTIVE"]
        	}
        	var includeArr2 = [
                    { model: model["User"],
                    attributes: {
                        exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
                    }
                }
                ];
            service.findAllRows(reviewModel,includeArr2 , queryObj1, offset, limit, field, order)
                .then(function(Reviews) {
                    return callback(null, Reviews);

                }).catch(function(error) {
                    console.log('Error :::', error);
                });
        },
        RelatedProducts: function(callback) {
        	var queryObj2={
        		sub_category_id:sub_category,
        		marketplace_id:marketplace_id
        	};
        	includeArr = [{ model: model["Vendor"] },
            { model: model["Marketplace"] },
            { model: model["MarketplaceType"] },
            { model: model["Category"] },
            { model: model["SubCategory"] },
            { model: model["Country"] },
            { model: model["State"] },
            { model: model["ProductMedia"], 
                where: {
                    status : {
                        '$eq': status["ACTIVE"]
                    }
                }
        }];
            service.findAllRows(productModel,includeArr, queryObj2, 0, 9, field, order)
                .then(function(RelatedProducts) {
                    return callback(null, RelatedProducts);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }
    }, function (err, results) {
        if (!err) {
        		var total = 0;
				var star5 = 0;
				var star4 = 0;
				var star3 = 0;
				var star2 = 0
				var star1 = 0;
				var productRating = {};
           		var rating = results.Review.rows;
					for (let elem in rating) {
						total = total + rating[elem].rating;
						switch (rating[elem].rating) {
							case 1:
								star1 = star1 + 1;
								break;
							case 2:
								star2 = star2 + 1;
								break;
							case 3:
								star3 = star3 + 1;
								break;
							case 4:
								star4 = star4 + 1;
								break;
							case 5:
								star5 = star5 + 1;
								break;
						}
					}
					maxSize = results.Review.count/limit;
					var avg = total / rating.length;
					productRating.avg = avg;
					productRating.star5 = star5;
					productRating.star4 = star4;
					productRating.star3 = star3;
					productRating.star2 = star2;
					productRating.star1 = star1;
					productRating.total = total;

	             	res.render('product-review', {
	                    title: "Global Trade Connect",
	                    product: results.Product,
	                    Reviews: results.Review.rows,
	                    LoggedInUser: LoggedInUser,
	                    Rating:productRating,
	                    RelatedProducts:results.RelatedProducts.rows,
	                    queryPaginationObj: queryPaginationObj,
	                    ratingCount:results.Review.count,
	                    
	                    // pagination
						page: page,
						pageCount:results.Review.count-offset,
						maxSize:maxSize,
						pageSize: limit,
						collectionSize: results.Review.count,
						queryParams:queryParams,
						// End pagination
	                });
	            } else {
	                res.render('product-review', {
	                    title: "Global Trade Connect"
	                });
	            }
    });
}
