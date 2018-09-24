'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./starter-seller.controller');

router.get('/', auth.isAuthenticated(), controller.starterSellerExpires);

module.exports = router;
