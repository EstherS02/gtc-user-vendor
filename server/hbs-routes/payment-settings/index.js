'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./payment-settings.controller');

router.get('/',auth.isAuthenticated(), controller.paymentSettings);

module.exports = router;