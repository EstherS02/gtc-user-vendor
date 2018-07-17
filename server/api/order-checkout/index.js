'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./order-checkout.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.post('/customer-information', auth.isAuthenticated(), controller.addCustomerInformation);

module.exports = router;