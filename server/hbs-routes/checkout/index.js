'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var customerInformationCtrl = require('./customer-information/customer-information.controller');
var shippingMethodCtrl = require('./shipping-method/shipping-method.controller');
var paymentMethodCtrl = require('./payment-method/payment-method.controller');
var confirmationCtrl = require('./confirmation/confirmation.controller');

router.get('/customer-information', auth.isAuthenticatedUser(), customerInformationCtrl.customerInformation);
router.get('/shipping-method', auth.isAuthenticatedUser(), customerInformationCtrl.shippingMethod);
router.get('/payment-method', auth.isAuthenticatedUser(), customerInformationCtrl.paymentMethod);
router.get('/confirmation/:order_id', auth.isAuthenticatedUser(), confirmationCtrl.confirmation);

module.exports = router;