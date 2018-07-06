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

    if (req.params.product_id)
        queryObj['id'] = req.params.product_id;

    if (req.params.product_slug)
        queryObj['product_slug'] = req.params.product_slug;

    queryObj['status'] = status["ACTIVE"];
    var wishQueryObj = {};
    if (LoggedInUser.id) {
        wishQueryObj = {
            user_id: LoggedInUser.id,
            status: {
                '$eq': status["ACTIVE"]
            }
        }
    }

    //includeArr = populate.populateData("Vendor,Marketplace,MarketplaceType,Category,SubCategory,Country,State")

    return model["Product"].findOne({
            where: queryObj,
            include: [{
                model: model["Vendor"]
            }, {
                model: model["Marketplace"]
            }, {
                model: model["MarketplaceType"]
            }, {
                model: model["Category"]
            }, {
                model: model["SubCategory"]
            }, {
                model: model["Country"]
            }, {
                model: model["State"]
            }, {
                model: model["WishList"],
                where: wishQueryObj,
                required: false
            }, {
                model: model["Review"],
                
                include: [{
                    model: model["User"],
                    attributes: {
                        exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
                    }
                }],
            }, {
                model: model["ProductMedia"],
                where: {
                    status: {
                        '$eq': status["ACTIVE"]
                    }
                }
            }],
            order: [
                [model["ProductMedia"], 'base_image', 'DESC'],
                [model["Review"], 'rating', 'DESC']
            ]
        }).then(function(product) {
            if (product) {
                var vendor_id = product.Vendor.id;
                // console.log("vendor_id",vendor_id)

                // console.log(product)
                var productsList = JSON.parse(JSON.stringify(product));

                let productReviewsList = _.groupBy(productsList.Reviews, "rating");

                var productRating = [{
                    starCount: 5,
                    ratingCount: 0
                }, {
                    starCount: 4,
                    ratingCount: 0
                }, {
                    starCount: 3,
                    ratingCount: 0
                }, {
                    starCount: 2,
                    ratingCount: 0
                }, {
                    starCount: 1,
                    ratingCount: 0
                }];

                var total = 0;
                var rating = productsList.Reviews;

                for (let key in rating) {
                    total = total + rating[key].rating;
                    if (rating[key].rating <= 5)
                        productRating[5 - rating[key].rating].ratingCount = productRating[5 - rating[key].rating].ratingCount + 1;
                }

                var productAvgRating = (total > 0) ? (total / rating.length).toFixed(1) : 0;

                productRating = productRating;//_.orderBy(productRating, ['ratingCount'], ['desc'])


                var field = 'id';
                var order = 'desc';
                var productModel = 'MarketplaceProduct';
                var queryObj2 = {}

                queryObj2.sub_category_id = productsList.sub_category_id;
                queryObj2.vendor_id = productsList.vendor_id;
                queryObj2.status = status["ACTIVE"];
                queryObj2.id = {
                    $ne: [productsList.id]
                };
                // console.log("productsList.WishList", productsList.WishLists)
                var result_obj = {
                    title: "Global Trade Connect",
                    product: productsList,
                    productReviewsList: productReviewsList,
                    LoggedInUser: LoggedInUser,
                    rating: productRating,
                    status: status,
                    VendorDetail: productsList.Vendor,
                    wishList: productsList.WishLists,
                    avgRating: productAvgRating
                };
                var vendorIncludeArr = [{
                model: model['Country']

            }, {
                model: model['VendorPlan'],

            }, {
                model: model['User'],
                attributes:['id'],
                include: [{
                    model: model['VendorVerification'],
                    where: {
                        vendor_verified_status: status['ACTIVE']
                    }
                }]

            },{
                model:model['VendorRating'],
                attributes:[ [sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating']],
                group: ['VendorRating.vendor_id'],
                required:false,
            }];
                service.findIdRow('Vendor', vendor_id, vendorIncludeArr)
                .then(function(response) {
                    if(response){
                    result_obj.VendorDetail = response;
                    }else{
                        result_obj.VendorDetail = [];
                    }

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
                // var result = {};
            var categoryQueryObj = {};
            var productCountQueryParames = {};

            categoryQueryObj['status'] = status["ACTIVE"];
            productCountQueryParames['status'] = status["ACTIVE"];
            if(vendor_id){
            productCountQueryParames['vendor_id'] = vendor_id;
            }
            if (req.query.marketplace_type) {
                productCountQueryParames['marketplace_type_id'] = req.query.marketplace_type;
            }
            service.getCategory(categoryQueryObj, productCountQueryParames)
                .then(function(categories) {
                    // return callback(null, response);
                     if(categories){
                        // console.log(response)
                    result_obj.categories = categories;
                    }else{
                        result_obj.categories = [];
                    }
                    // console.log("response",result_obj.categories)
                });

                service.findRows(productModel, queryObj2, 0, 9, field, order)
                    .then(function(RelatedProducts) {
                        // console.log(RelatedProducts.rows)
                        // console.log("-RelatedProducts-RelatedProducts-RelatedProducts-RelatedProducts-RelatedProducts")
                        if (RelatedProducts) {
                            result_obj.RelatedProducts = RelatedProducts.rows;
                        } else {
                            result_obj.RelatedProducts = [];
                        }
                        console.log("result_obj",result_obj)
                        res.render('product-view', result_obj);
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        res.render('product-view', result_obj);
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


// export function productView(req, res) {
//     //old code

//     let searchObj = {}

//     if (req.params.product_id)
//         searchObj["id"] = req.params.product_id;

//     if (req.params.product_slug)
//         searchObj["product_slug"] = req.params.product_slug;

//     service.findOneRow('Product', searchObj)
//         .then(function(productDetails) {
//             res.render('productView', {
//                 title: 'Global Trade Connect',
//                 productDetails: productDetails
//             });
//         }).catch(function(error) {
//             console.log('Error :::', error);
//             res.render('productView', error)
//         });
// }



export function GetProductReview(req, res) {
    var queryObj = {};
    var includeArr = [];
    var LoggedInUser = {};
    var queryPaginationObj = {};
    var queryParams = {};
    var sub_category;
    var vendor_id;
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

    if (req.params.product_id)
        queryParams['id'] = req.params.product_id;


    if (req.params.product_slug)
        queryParams['product_slug'] = req.params.product_slug;

    queryObj['status'] = status["ACTIVE"];
    var includeArr = [];

    async.series({
        Product: function(callback) {
            var includeArr1 = [{
                model: model["ProductMedia"],
                where: {
                    status: {
                        '$eq': status["ACTIVE"]
                    }
                }
            }];
            var id = {
                id: req.params.product_id
            }
            service.findRow(productModel, id, includeArr1)
                .then(function(product) {
                    sub_category = product.sub_category_id;
                    // marketplace_id = product.marketplace_id;
                    vendor_id = product.vendor_id;
                    return callback(null, product);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        Review: function(callback) {
            var reviewModel = "Review";
            var queryObj1 = {
                product_id: req.params.product_id,
                status: status["ACTIVE"]
            }
            var includeArr2 = [{
                model: model["User"],
                attributes: {
                    exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
                }
            }];
            service.findAllRows(reviewModel, includeArr2, queryObj1, offset, limit, field, order)
                .then(function(Reviews) {
                    return callback(null, Reviews);

                }).catch(function(error) {
                    console.log('Error :::', error);
                });
        },
        AllReviews: function(callback) {
            var reviewModel = "Review";
            var queryObj1 = {
                product_id: req.params.product_id,
                status: status["ACTIVE"]
            }
            var includeArr2 = [{
                model: model["User"],
                attributes: {
                    exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
                }
            }];
            service.findAllRows(reviewModel, includeArr2, queryObj1, null, null, field, order)
                .then(function(AllReviews) {
                    return callback(null, AllReviews);
                }).catch(function(error) {
                    console.log('Error :::', error);
                });
        },
        VendorDetail: function(callback) {
        var vendorIncludeArr = [{
                model: model['Country']

            }, {
                model: model['VendorPlan'],

            }, {
                model: model['User'],
                attributes:['id'],
                include: [{
                    model: model['VendorVerification'],
                    where: {
                        vendor_verified_status: status['ACTIVE']
                    }
                }]

            },{
                model:model['VendorRating'],
                attributes:[ [sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating']],
                group: ['VendorRating.vendor_id'],
                required:false,
            }];
            service.findIdRow('Vendor', vendor_id, vendorIncludeArr)
                .then(function(response) {
                    return callback(null, response);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        RelatedProducts: function(callback) {
            var queryObj2 = {
                sub_category_id: sub_category,
                vendor_id: vendor_id,
                id: {
                    $ne: req.params.product_id
                }
            };
            includeArr = [{
                model: model["Vendor"]
            }, {
                model: model["Marketplace"]
            }, {
                model: model["MarketplaceType"]
            }, {
                model: model["Category"]
            }, {
                model: model["SubCategory"]
            }, {
                model: model["Country"]
            }, {
                model: model["State"]
            }, {
                model: model["ProductMedia"],
                where: {
                    status: {
                        '$eq': status["ACTIVE"]
                    }
                }
            }];
            service.findAllRows(productModel, includeArr, queryObj2, 0, 9, field, order)
                .then(function(RelatedProducts) {
                    return callback(null, RelatedProducts);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        categories: function(callback) {
            var result = {};
            var categoryQueryObj = {};
            var productCountQueryParames = {};

            categoryQueryObj['status'] = status["ACTIVE"];
            productCountQueryParames['status'] = status["ACTIVE"];
            if(vendor_id){
            productCountQueryParames['vendor_id'] = vendor_id;
            }
            if (req.query.marketplace_type) {
                productCountQueryParames['marketplace_type_id'] = req.query.marketplace_type;
            }
            if (req.query.location) {
                productCountQueryParames['product_location'] = req.query.location;
            }
            if (req.query.keyword) {
                productCountQueryParames['product_name'] = {
                    like: '%' + req.query.keyword + '%'
                };
            }
            service.getCategory(categoryQueryObj, productCountQueryParames)
                .then(function(response) {
                    return callback(null, response);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }

    }, function(err, results) {
        console.log("results**************",results)
        if (!err) {
            maxSize = results.Review.count / limit;
            if (results.Review.count % limit)
                maxSize++;

            var productRating = [{
                starCount: 5,
                ratingCount: 0
            }, {
                starCount: 4,
                ratingCount: 0
            }, {
                starCount: 3,
                ratingCount: 0
            }, {
                starCount: 2,
                ratingCount: 0
            }, {
                starCount: 1,
                ratingCount: 0
            }];

            var total = 0;
            var rating = results.AllReviews.rows;

            for (let key in rating) {
                total = total + rating[key].rating;
                if (rating[key].rating <= 5)
                    productRating[5 - rating[key].rating].ratingCount = productRating[5 - rating[key].rating].ratingCount + 1;
            }
            var productAvgRating = (total > 0) ? (total / rating.length).toFixed(1) : 0;

            productRating = _.orderBy(productRating, ['ratingCount'], ['desc'])

            res.render('product-review', {
                title: "Global Trade Connect",
                product: results.Product,
                Reviews: results.Review.rows,
                LoggedInUser: LoggedInUser,
                Rating: productRating,
                AvgRating: productAvgRating,
                RelatedProducts: results.RelatedProducts.rows,
                queryPaginationObj: queryPaginationObj,
                ratingCount: results.Review.count,
                VendorDetail:results.VendorDetail,
                categories:results.categories,

                // pagination
                page: page,
                pageCount: results.Review.count - offset,
                maxSize: maxSize,
                pageSize: limit,
                collectionSize: results.Review.count,
                queryParams: queryParams,
                // End pagination
            });
        } else {
            res.render('product-review', {
                title: "Global Trade Connect"
            });
        }
    });
}