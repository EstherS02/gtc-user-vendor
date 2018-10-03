'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service')

var subscriptionCtrl = require('./subscription.controller');

router.get('/',  auth.isAuthenticated(), subscriptionCtrl.subscriptions);

module.exports = router;