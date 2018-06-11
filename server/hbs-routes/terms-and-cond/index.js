'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

/* Handlebars routes */
var controller = require('./terms-and-cond.controller');

router.get('/', auth.isAuthenticated(), controller.termsAndCond);

module.exports = router;