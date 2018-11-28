'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var roles = require('../../config/roles');
var auth = require('../../auth/auth.service');

var controller = require('./faq.controller');

router.get('/', auth.hasRole(roles['USER']), controller.faq);

module.exports = router;