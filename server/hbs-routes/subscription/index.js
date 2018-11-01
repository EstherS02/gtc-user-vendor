'use strict';

var express = require('express');
var router = express.Router();
var roles = require('../../config/roles');
var auth = require('../../auth/auth.service')

var subscriptionCtrl = require('./subscription.controller');

router.get('/', auth.hasRole(roles['USER']), subscriptionCtrl.subscriptions);

module.exports = router;