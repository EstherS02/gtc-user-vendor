'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./stripe.controller');
var permission = require('../../config/permission');

var router = express.Router();

router.get('/connect', auth.isAuthenticated(), controller.stripeConnect);

module.exports = router;

