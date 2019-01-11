'use strict';

var express = require('express');
var router = express.Router();
var roles = require('../../config/roles');
var auth = require('../../auth/auth.service');
var controller = require('./billing-settings.controller');

router.get('/', auth.hasRole(roles['USER']), controller.billingSettings);

module.exports = router;