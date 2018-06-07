'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');

export function search(req, res) {
    console.log("req.query", req.query);
    var includeArr = [];
    includeArr = [
        { model: model['Country'],  as: Country },
        { model: model['State'], as:State }
    ]
   
    model["Product"].findAll({

        include: includeArr,
        where: {
            product_category_id:req.query.product_category_id,
            $or: [
                {'Country.name': req.query.country},
                {'State.name': req.query.state}
              ]
        }
    })
        .then(function (row) {
            res.status(200).send(row);
            return;
        }).catch(function (error) {
            if (error) {
                res.status(500).send(error);
                return;
            }
        });
}
