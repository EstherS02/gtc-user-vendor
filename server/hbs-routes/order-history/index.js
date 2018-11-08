'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service');

var orderHistoryCtrl = require('./order-history/order-history.controller');
var orderViewCtrl = require('./order-view/order-view.controller');

router.get('/', auth.hasRole(roles['USER']), orderHistoryCtrl.orderHistory);
router.get('/:id', auth.hasRole(roles['USER']), orderViewCtrl.orderView);
router.get('/:id/track-order-item/:orderItemId', auth.hasRole(roles['USER']), orderViewCtrl.trackOrderItem);

module.exports = router;