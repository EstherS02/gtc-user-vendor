'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./cart.controller');
var permission = require('../../config/permission');

var router = express.Router();

router.get('/check-already-subscribed/:id', auth.isAuthenticatedUser(), controller.checkAlreadySubscribed);
//router.post('/validate-cart')
router.post('/update-cart', auth.isAuthenticated(), controller.updateCart);
router.post('/apply-coupon', auth.isAuthenticatedUser(), controller.applyCoupon);
router.post('/add-cart/:id', auth.isAuthenticated(), controller.addToCart);
router.delete('/cancel-coupon', auth.isAuthenticatedUser(), controller.cancelCoupon);
router.delete('/remove-cart/:id', auth.isAuthenticated(), controller.removeCart);

module.exports = router;