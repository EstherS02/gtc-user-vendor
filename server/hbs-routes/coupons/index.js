'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./coupons.controller');

router.get('/', auth.isAuthenticated() , controller.coupons);
router.get('/edit-coupons', auth.isAuthenticated() ,controller.editCoupons);
router.get('/add-coupon', auth.isAuthenticated() ,controller.addCoupon);

module.exports = router;