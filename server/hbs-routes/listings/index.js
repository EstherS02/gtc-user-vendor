'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service')
var globalUser = require('../../auth/global-user-obj');

var viewListingsCtrl = require('./view-listings/view-listings.controller');
var addProductCtrl   = require('./add-product/add-product.controller');

router.get('/:type',  auth.hasRole(roles['VENDOR']), viewListingsCtrl.viewListings);
router.get('/:type/add-product',  auth.isAuthenticated(), addProductCtrl.addProduct);
router.get('/:type/edit-product/:id',  auth.isAuthenticated(), addProductCtrl.addProduct);


module.exports = router;
