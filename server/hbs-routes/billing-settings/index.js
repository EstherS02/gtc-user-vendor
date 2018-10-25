'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./billing-settings.controller');

router.get('/', auth.isAuthenticated(), controller.billingSettings);


module.exports = router;