'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');

export function search(req, res) {
    console.log("req.query", req.query);
    var includeArr = [];
    var whereCondition = {};
    includeArr = [
        { model: model['Country'], as: 'Country' },
        { model: model['State'], as: 'State' }
    ]
    if (req.query.category) {
        whereCondition['product_category_id'] = req.query.category;
    }
    if (req.query.keyword) {
        whereCondition['product_name'] = { like: '%' + req.query.keyword + '%' }
    }
    if (req.query.location) {
        whereCondition['$or'] = [
            { '$Country.name$': req.query.location },
            { '$State.name$': req.query.location },
            { city: req.query.location },
        ]
    }
    console.log("whereCondition", whereCondition);

    model["Product"].findAll({
        include: includeArr,
        where: whereCondition
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
