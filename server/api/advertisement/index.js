'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./advertisement.controller');

router.post('/', auth.isAuthenticated(), controller.createAd);

module.exports = router;