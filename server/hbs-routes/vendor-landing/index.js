'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./vendor-landing.controller');

router.get('/', auth.isAuthenticated(), controller.vendorLanding);

module.exports = router;