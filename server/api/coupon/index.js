'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./coupon.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.put('/update', controller.updateCoupon);
router.put('/update-product-coupon', controller.updateProductCoupon);
router.put('/update-category-coupon',controller.updateCategoryCoupon);

module.exports = router;