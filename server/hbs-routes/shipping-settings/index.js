'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./shipping-settings.controller');

router.get('/',auth.isAuthenticated(), controller.shippingSettings);

module.exports = router;