'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./terms-and-cond.controller');

router.get('/', auth.isAuthenticated(), controller.termsAndCond);

module.exports = router;