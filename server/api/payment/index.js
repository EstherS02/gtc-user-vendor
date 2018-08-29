'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./payment.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();
router.post('/pay', auth.isAuthenticated(), controller.makePayment);
router.post('/card', auth.isAuthenticated(), controller.createCard);
router.post('/cancel-order/:orderItemId', auth.isAuthenticated(), controller.cancelOrder);
router.delete('/card', auth.isAuthenticated(), controller.deleteCard);
router.get('/vendorMail', auth.isAuthenticated(), controller.vendorMail)
module.exports = router;