'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./notifications.controller');

router.get('/', auth.isAuthenticated(), controller.notifications)

module.exports = router;