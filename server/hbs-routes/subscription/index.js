'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service')

var subscriptionCtrl = require('./subscription.controller');

router.get('/:product_id',  auth.isAuthenticated(), subscriptionCtrl.subscribe);

module.exports = router;