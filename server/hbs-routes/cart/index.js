'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service')

var controller = require('./cart.controller');

router.get('/', auth.isAuthenticated(), controller.cart);


module.exports = router;
