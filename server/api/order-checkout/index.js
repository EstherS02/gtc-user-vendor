'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./order-checkout.controller');
var permission = require('../../config/permission');

var router = express.Router();

router.post('/customer-information', auth.isAuthenticatedUser(), controller.addCustomerInformation);

module.exports = router;