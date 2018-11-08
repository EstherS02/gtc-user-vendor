'use strict';

var express = require('express');
var router = express.Router();
var roles = require('../../config/roles');
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

var controller = require('./terms-and-cond.controller');

router.get('/', auth.hasRole(roles['VENDOR']), controller.termsAndCond);

module.exports = router;