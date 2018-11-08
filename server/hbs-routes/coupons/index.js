'use strict';

var express = require('express');
var router = express.Router();
const roles = require('../../config/roles');
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

/* Handlebars routes */
var controller = require('./coupons.controller');

router.get('/', auth.hasRole(roles['VENDOR']), controller.coupons);
router.get('/edit-coupons', auth.hasRole(roles['VENDOR']), controller.editCoupons);
router.get('/add-coupon', auth.hasRole(roles['VENDOR']), controller.addCoupon);

module.exports = router;