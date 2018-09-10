'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./paypal.controller');
var permission = require('../../config/permission');

var router = express.Router();

router.get('/', controller.paypalVerifyEmailOAuth);

module.exports = router;