'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service')
var globalUser = require('../../auth/global-user-obj');

var customerInformationCtrl = require('./customer-information/customer-information.controller');
var shippingMethodCtrl = require('./shipping-method/shipping-method.controller');
var paymentMethodCtrl = require('./payment-method/payment-method.controller');
var confirmationCtrl = require('./confirmation/confirmation.controller');

router.get('/customer-information', auth.isAuthenticated(), customerInformationCtrl.customerInformation);
router.get('/shipping-method', auth.isAuthenticated(), customerInformationCtrl.shippingMethod);
router.get('/payment-method', auth.isAuthenticated(), customerInformationCtrl.paymentMethod);
router.get('/confirmation', auth.isAuthenticated(), confirmationCtrl.confirmation);

module.exports = router;