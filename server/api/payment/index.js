'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./payment.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.makePayment);

module.exports = router;