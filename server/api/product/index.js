'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var check = require('../../auth/check-limit-exceeds');
var controller = require('./product.controller');
var permission = require('../../config/permission');
const roles = require('../../config/roles');

var router = express.Router();

router.get('/:id', controller.productView);
router.get('/:id/reviews', controller.productReviews);
router.get('/:id/rating-counts', controller.productRatingsCount);
router.post('/discount', controller.discount);
router.post('/import-woocommerce', auth.hasRole(roles['VENDOR']), auth.hasPermission(), controller.importWoocommerce);
router.post('/import-aliexpress', auth.hasRole(roles['VENDOR']), auth.hasPermission(), controller.importAliExpress);
router.post('/', auth.hasRole(roles['VENDOR']), auth.hasPermission(), check.limitExceeds(), controller.create);
router.post('/add-product', auth.isAuthenticated(), controller.addProduct);
router.post('/edit-product', auth.isAuthenticated(), controller.editProduct);
router.put('/feature-one/:id', controller.featureOne);
router.put('/feature-many', controller.featureMany);
router.post('/import-product', auth.isAuthenticated(), controller.importProduct);

module.exports = router;