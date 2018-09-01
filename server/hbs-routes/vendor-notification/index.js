'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var auth = require('../../auth/auth.service');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./vendor-notification.controller');

router.get('/', auth.isAuthenticated(), controller.notifications)
router.get('/settings', auth.isAuthenticated(), controller.notificationSettings);
// var router = express.Router();

module.exports = router;