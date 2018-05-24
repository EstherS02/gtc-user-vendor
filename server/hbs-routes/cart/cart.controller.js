'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');


export function cart(req, res) {
    
    let user_id = 63;

    async.series({
        cartItems: function(cb) {
            
            var queryObj = {};
            queryObj['user_id'] = user_id;

            model['Cart'].findAndCountAll({
                where: queryObj,
                include: [
                    { model: model["User"] }, 
                    { model: model["Product"],
                    include : [
                               { model : model['Vendor'] },
                               { model: model['Marketplace'] },
                               { model: model['MarketplaceType'] }
                            ]
                        }],
                offset: null,
                limit: null,
                order: [
                    ["created_on", "asc"]
                ]
            }).then(function(data) {
                return cb(null, data)
            }).catch(function(error) {
                return cb(error);
            });
            
        },
        marketPlace: function(cb) {

            model['Marketplace'].findAndCountAll({
                where: {},
                offset: null,
                limit: null,
                order: [
                    ["created_on", "asc"]
                ]
            }).then(function(marketPlaceData) {
                return cb(null, marketPlaceData)
            }).catch(function(error) {
                return cb(error);
            });
            
        }        
    }, function(err, results) {
        if(!err){
             return res.status(200).render('cart', {
                title : "Global Trade Connect",
                cartItems: results.cartItems.rows,
                cartItemsCount: results.cartItems.count,
                marketPlaces: results.marketPlace.rows
            });
            /* return res.status(200).send({
                title : "Global Trade Connect",
                cartItems: results.cartItems.rows,
                cartItemsCount: results.cartItems.count,
                marketPlaces: results.marketPlace.rows
            }); */
        }else{
            console.log(err)
			return res.status(500).render(err);
        }
    });

}
