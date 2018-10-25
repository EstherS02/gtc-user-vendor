'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service')

var viewListingsCtrl = require('./view-listings/view-listings.controller');
var addProductCtrl   = require('./add-product/add-product.controller');

router.get('/:type',  auth.isAuthenticated(), viewListingsCtrl.viewListings);
router.get('/:type/add-product',  auth.isAuthenticated(), addProductCtrl.addProduct);
router.get('/:type/edit-product/:id',  auth.isAuthenticated(), addProductCtrl.addProduct);

module.exports = router;
