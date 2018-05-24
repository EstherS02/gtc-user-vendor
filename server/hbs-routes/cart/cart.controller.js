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
        one: function(cb) {
            
        var queryObj = {};
        queryObj['user_id'] = user_id;

        service.findRows('Cart', queryObj, null, null, "id", "asc")
          .then(function (rows) {
            return cb(null, rows);
          }).catch(function (error) {
              console.log(error)
            return cb(error);
          });
            
        }
    }, function(err, results) {
        if(!err){
            return res.status(200).send(results);
        }else{
            console.log('Error :::', error);
			return res.status(500).send("Internal server error");
        }
        /* res.render('cart', {
            title: 'Global Trade Connect',
            results: results.one
        }); */
    });

}
