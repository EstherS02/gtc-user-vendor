'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./verification.controller');

router.get('/',auth.isAuthenticated(), controller.verification);

module.exports = router;