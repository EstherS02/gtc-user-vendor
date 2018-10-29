'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./payment.controller');

var router = express.Router();
router.post('/pay', auth.isAuthenticated(), controller.makePayment);
router.post('/planpay', auth.isAuthenticated(), controller.makePlanPayment);
router.post('/card', auth.isAuthenticated(), controller.createCard);
router.post('/cancel-order/:orderItemId', auth.isAuthenticated(), controller.cancelOrder);
router.post('/refund-order/:orderId', auth.isAuthenticated(), controller.refundOrder);
router.delete('/card', auth.isAuthenticated(), controller.deleteCard);
// router.get('/sendOrderMail', auth.isAuthenticated(),controller.sendOrderMail)
module.exports = router;