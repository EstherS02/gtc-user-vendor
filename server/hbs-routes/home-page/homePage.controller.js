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
                        .then(function (RequestForQuote) {



                            res.render('homePage', {
                                title: 'Global Trade Connect',
                                wantToSell: wantToSell.rows,
                                wantToBuy: wantToBuy.rows,
                                wantToTrade: wantToTrade.rows,
                                RequestForQuote: RequestForQuote.rows

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
