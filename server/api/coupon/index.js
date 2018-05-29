'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./cart.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.post('/add-coupon', controller.addToCart);

module.exports = router;
