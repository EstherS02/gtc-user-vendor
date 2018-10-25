'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./vendor-notification.controller');

router.get('/', auth.isAuthenticated(), controller.notifications)
router.get('/settings', auth.isAuthenticated(), controller.notificationSettings);

module.exports = router;