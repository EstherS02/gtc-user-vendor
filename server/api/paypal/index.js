'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./paypal.controller');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.paypalVerifyEmailOAuth);
router.post('/disconnect', auth.isAuthenticated(), controller.payPalEmailDisconnect);

module.exports = router;