'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

var orderHistoryCtrl = require('./order-history/order-history.controller');
var orderViewCtrl = require('./order-view/order-view.controller');

router.get('/', auth.isAuthenticated(), orderHistoryCtrl.orderHistory);
router.get('/:id', auth.isAuthenticated(), orderViewCtrl.orderView);

module.exports = router;


