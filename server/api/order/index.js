'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./order.controller');

var router = express.Router();

router.get('/subscription-order', controller.subscriptionOrder);
router.get('/:id', controller.orderItemdetails);


module.exports = router;