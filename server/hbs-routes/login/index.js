'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./login.controller');

router.get('/', auth.isLoggedIn(), controller.login);

module.exports = router;