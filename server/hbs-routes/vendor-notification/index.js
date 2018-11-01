'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var auth = require('../../auth/auth.service');
var roles = require('../../config/roles');
var permission = require('../../config/permission');

/* Handlebars routes */
var controller = require('./vendor-notification.controller');

router.get('/', auth.hasRole(roles['VENDOR']), controller.notifications)
router.get('/settings', auth.hasRole(roles['VENDOR']), controller.notificationSettings);
// var router = express.Router();

module.exports = router;