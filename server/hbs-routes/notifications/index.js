'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var auth = require('../../auth/auth.service');
const roles = require('../../config/roles');
var permission = require('../../config/permission');

/* Handlebars routes */
var controller = require('./notifications.controller');

router.get('/', auth.hasRole(roles['USER']), controller.notifications)
// var router = express.Router();

module.exports = router;