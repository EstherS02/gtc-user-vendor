'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./notification.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.post('/addSettings',auth.isAuthenticated(), controller.notificationSetting);

module.exports = router;