'use strict';

var async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const marketplace = require('../../config/marketplace.js');
const status = require('../../config/status');
const roles = require('../../config/roles');

export function featureMany(req, res) {
    const ids = req.body.ids;
    console.log("requestedIds", ids.length);
    var arr = [];
    for (var i = 0; i <= ids.length - 1; i++) {
        var obj = {};
        obj['product_id'] = ids[i];
        obj['status'] = 1;
        obj['start_date'] = new Date();
        obj['created_on'] = new Date();
        arr.push(obj);
    }
    model["FeaturedProduct"].bulkCreate(arr, {
            ignoreDuplicates: true
        })
        .then(function(row) {
            res.status(201).send("Created");
            return;
        }).catch(function(error) {
            if (error) {
                res.status(500).send(error);
                return;
            }
        });
}

export function create(req, res) {
    var bodyParams = {};
    var productModelName = "Product";

    req.checkBody('product_name', 'Missing Query Param').notEmpty();
    req.checkBody('sku', 'Missing Query Param').notEmpty();
    req.checkBody('marketplace_id', 'Missing Query Param').notEmpty();
    req.checkBody('product_category_id', 'Missing Query Param').notEmpty();
    req.checkBody('sub_category_id', 'Missing Query Param').notEmpty();
    req.checkBody('price', 'Missing Query Param').notEmpty();
    req.checkBody('product_location', 'Missing Query Param').notEmpty();
    req.checkBody('state_id', 'Missing Query Param').notEmpty();
    req.checkBody('city', 'Missing Query Param').notEmpty();


    if (req.user.role === roles['ADMIN']) {
        req.checkBody('vendor_id', 'Missing Query Param').notEmpty();
    }
    if (req.body.marketplace_id === marketplace['WHOLESALE']) {
        req.checkBody('marketplace_type_id', 'Missing Query Param').notEmpty();
        req.checkBody('moq', 'Missing Query Param').notEmpty();
    }

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send('Missing Query Params');
        return;
    }

    bodyParams = req.body;
    if (req.user.role === roles['VENDOR']) {
        bodyParams['vendor_id'] = req.user.Vendor.id;
    }
    bodyParams['product_slug'] = string_to_slug(req.body.product_name);
    bodyParams['quantity_available'] = req.body.sku;
    bodyParams['status'] = status['ACTIVE'];
    bodyParams['publish_date'] = new Date();
    bodyParams['created_on'] = new Date();

    service.createRow(productModelName, bodyParams)
        .then(function(product) {
            return res.status(201).send(product);
        })
        .catch(function(error) {
            console.log('Error:::', error);
            return res.status(500).send("Internal server error.");
        })
}

export function featureOne(req, res) {
    model["Product"].findById(req.params.id)
        .then(function(row) {
            if (row) {
                var obj = {};
                obj['product_id'] = row.id;
                obj['status'] = 1;
                obj['start_date'] = new Date();
                obj['created_on'] = new Date();
                model["FeaturedProduct"].upsert(obj)
                    .then(function(row) {
                        res.status(201).send("Created");
                        return;
                    })
                    .catch(function(error) {
                        if (error) {
                            res.status(500).send(error);
                            return;
                        }
                    });
            } else {
                res.status(404).send("Not found");
                return;
            }
        }).catch(function(error) {
            console.log('Error:::', error);
            res.status(500).send("Internal server error");
            return;
        });
}

export function addProduct(req, res) {

    req.query.vendor_id = req.user.Vendor.id;
    req.query.status = 1;
    req.query.publish_date = new Date();

    model["Product"].create(req.query)
        .then(function(row) {
            req.body.product_id = row.id;
            if (req.body.url) {
                model["ProductMedia"].create(req.body)
                    .then(function(row) {
                        console.log('Created:::', row);
                        res.status(200).send("Created");
                        return;
                    }).catch(function(error) {
                        console.log('Error:::', error);
                        res.status(500).send("Internal server error");
                        return;
                    });
            } else {
                console.log("no image sucess")
                res.status(200).send("Created");
                return;
            }
        }).catch(function(error) {
            console.log('Error:::', error);
            res.status(500).send("Internal server error");
            return;
        })
}

export function editProduct(req, res) {

    var id = req.query.product_id;

    var stat = req.body.status;
    delete req.body.status;

    req.body.status = status[stat];
    var bodyParams = req.body;

    model["Product"].update(bodyParams, {
        where: {
            id: id
        }
    }).then(function(row) {
        if (row) {
            res.status(200).send("Created");
        } else {
            res.status(500).send("Internal server error");
        }
    }).catch(function(error) {
        res.status(500).send(error);
    })
}

function string_to_slug(str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to = "aaaaeeeeiiiioooouuuunc------";
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
}