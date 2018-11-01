'use strict';

var express = require('express');
var router = express.Router();
var roles = require('../../config/roles');
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

/* Handlebars routes */
var controller = require('./verification.controller');

router.get('/', auth.hasRole(roles['VENDOR']), controller.verification);


module.exports = router;