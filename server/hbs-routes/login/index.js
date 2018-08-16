'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./login.controller');

router.get('/', controller.login);

module.exports = router;