'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');


export function homePage(req, res) {

    var field = "id";
    var order = "asc";

    service.findRows('ProductSales', { marketplace_type: 'Want To Sell' }, 0, 5, field, order)
        .then(function (wantToSell) {

            service.findRows('ProductSales', { marketplace_type: 'Want To Buy' }, 0, 5, field, order)
                .then(function (wantToBuy) {

                    service.findRows('ProductSales', { marketplace_type: 'Want To Trade' }, 0, 5, field, order)
                        .then(function (wantToTrade) {

                            service.findRows('ProductSales', { marketplace_type: 'Request For Quote' }, 0, 5, field, order)
                                .then(function (requestForQuote) {

                                    service.findRows('ProductSales', { marketplace: 'Public Marketplace' }, 0, 5, field, order)
                                        .then(function (publicMarketplace) {

                                            service.findRows('ProductSales', { marketplace: 'Service Marketplace' }, 0, 5, field, order)
                                                .then(function (serviceMarketplace) {


                                                    service.findRows('ProductSales', { marketplace: 'Lifestyle Marketplace' }, 0, 5, field, order)
                                                        .then(function (lifestyleMarketplace) {

                                                            service.findRows('FeaturedproductProduct', {}, 0, 4, field, order)
                                                                .then(function (featuredProducts) {


                                                                    res.render('homePage', {
                                                                        title: 'Global Trade Connect',
                                                                        wantToSell: wantToSell.rows,
                                                                        wantToBuy: wantToBuy.rows,
                                                                        wantToTrade: wantToTrade.rows,
                                                                        requestForQuote: requestForQuote.rows,
                                                                        publicMarketplace: publicMarketplace.rows,
                                                                        serviceMarketplace: serviceMarketplace.rows,
                                                                        featuredProducts: featuredProducts.rows

                                                                    });


                                                                }).catch(function (error) {
                                                                    console.log('Error :::', error);
                                                                    res.status(500).send("Internal server error");
                                                                    return
                                                                });

                                                        }).catch(function (error) {
                                                            console.log('Error :::', error);
                                                            res.status(500).send("Internal server error");
                                                            return
                                                        });

                                                }).catch(function (error) {
                                                    console.log('Error :::', error);
                                                    res.status(500).send("Internal server error");
                                                    return
                                                });

                                        }).catch(function (error) {
                                            console.log('Error :::', error);
                                            res.status(500).send("Internal server error");
                                            return
                                        });

                                }).catch(function (error) {
                                    console.log('Error :::', error);
                                    res.status(500).send("Internal server error");
                                    return
                                });


                        }).catch(function (error) {
                            console.log('Error :::', error);
                            res.status(500).send("Internal server error");
                            return
                        });

                }).catch(function (error) {
                    console.log('Error :::', error);
                    res.status(500).send("Internal server error");
                    return
                });

        }).catch(function (error) {
            console.log('Error :::', error);
            res.status(500).send("Internal server error");
            return
        });
}
