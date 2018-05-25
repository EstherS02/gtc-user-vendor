'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const _ = require('lodash');


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
                               { model : model['Vendor']},
                               { model : model['Category']},
                               { model : model['SubCategory']},
                               { model: model['Marketplace']},
                               { model : model['MarketplaceType']},
                               { model : model['ProductMedium']},
                               { model : model ['Country']},
                               { model : model ['State']}
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
                console.log(error)
                //return cb(error);
            });
            
        }        
    }, function(err, results) {
        if(!err){

            var totalItems = results.cartItems.rows; 
            var allMarketPlaces = results.marketPlace.rows;
            var totalPrice = {}
            var defaultShipping = 50;
         
            var seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");

            
            _.forOwn(seperatedItems, function(itemsValue, itemsKey) {
                totalPrice[itemsKey] = {};
                totalPrice[itemsKey]['price'] = 0;
                totalPrice[itemsKey]['shipping'] = 0;
                for(var i=0; i<itemsValue.length; i++){
                    if((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price){
                        totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + (itemsValue[i].quantity * itemsValue[i].Product.price);
                        totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
                    }
                }
            });

            
            console.log(totalPrice)
            

               return res.status(200).render('cart', {
                title : "Global Trade Connect",
                cartItems: results.cartItems.rows,
                cartItemsCount: results.cartItems.count,
                marketPlaces: results.marketPlace.rows,
                seperatedItemsList : seperatedItems,
                totalPriceList: totalPrice
            });   
             /* return res.status(200).send({
                title : "Global Trade Connect",
                seperatedItemsList : seperatedItems,
                cartItems: results.cartItems.rows,
                cartItemsCount: results.cartItems.count,
                marketPlaces: results.marketPlace.rows,
                seperatedItemsList : seperatedItems
            }); */ 
        }else{
            console.log(err)
			return res.status(500).render(err);
        }
    });

}


function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}
