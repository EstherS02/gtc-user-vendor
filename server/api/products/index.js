'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./products.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

//router.put('/order/:id', controller.productDec);
router.get('/order/total-price', controller.totalPrice);
router.put('/order/couponExp', controller.couponExp)

module.exports = router;