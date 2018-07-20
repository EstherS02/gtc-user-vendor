'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

var controller = require('./order-history.controller');

router.get('/', auth.isAuthenticated(), controller.orderHistory);

module.exports = router;