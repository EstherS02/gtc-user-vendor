'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./payment.controller');
var permission = require('../../config/permission');
var roles = require('../../config/roles');

var router = express.Router();
router.post('/pay', auth.isAuthenticatedUser(), controller.makePayment);
router.post('/planpay', auth.isAuthenticated(), controller.makePlanPayment);
router.post('/card', auth.isAuthenticatedUser(), controller.createCard);
router.post('/cancel-order', auth.isAuthenticated(), controller.cancelOrder);
router.post('/return-order', auth.isAuthenticated(), controller.returnOrder);
router.post('/confirm-order', auth.hasRole(roles['VENDOR']), controller.confirmOrder);
router.post('/refund-order/:orderId', auth.isAuthenticated(), controller.refundOrder);
router.delete('/card', auth.isAuthenticated(), controller.deleteCard);
// router.get('/sendOrderMail', controller.sendOrderMail)
module.exports = router;