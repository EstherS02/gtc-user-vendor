'use strict';

const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');
const sequelize = require('sequelize');
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

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
        LoggedInUser = req.gtcGlobalUserObj;
    }

    if(req.params.product_id)
        queryObj['id'] = req.params.product_id;

    if(req.params.product_slug)
        queryObj['product_slug'] = req.params.product_slug;

        queryObj['status'] = status["ACTIVE"]
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
            var total = 0;
				var star5 = 0;
				var star4 = 0;
				var star3 = 0;
				var star2 = 0
				var star1 = 0;
			var productRating = {};
            var rating = productsList.Reviews;
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
                    product: productsList,
                    productReviewsList: productReviewsList,
                    LoggedInUser: LoggedInUser,
                    Rating:productRating
                });
            } else {
                res.render('product-review', {
                    title: "Global Trade Connect"
                });
            }
        })
        .catch(function(error) {
            console.log('Error:::', error);
            res.render('product-review', error);
        });

}
