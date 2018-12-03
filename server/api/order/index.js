'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./order.controller');
var roles = require('../../config/roles');
var permission = require('../../config/permission');

var router = express.Router();

router.get('/:id', controller.orderItemdetails);
router.get('/', auth.hasRole(roles['ADMIN']), controller.index);
router.put("/dispatch/:orderId", auth.hasRole(roles['VENDOR']), controller.dispatchOrder);

module.exports = router;