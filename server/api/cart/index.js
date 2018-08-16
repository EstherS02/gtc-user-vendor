'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./cart.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.post('/add-cart/:id', auth.isAuthenticated(), controller.addToCart);
router.delete('/remove-cart/:id', auth.isAuthenticated(), controller.removeCart);
router.post('/update-cart', auth.isAuthenticated(), controller.updateCart);
router.post('/apply-coupon', auth.isAuthenticated(), controller.applyCoupon);

module.exports = router;