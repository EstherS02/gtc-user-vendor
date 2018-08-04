'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

/* Handlebars routes */
var controller = require('./user-profile.controller');

router.get('/my-profile', auth.isAuthenticated(), controller.userProfile);
router.get('/forgot-password', controller.forgotPassword);

module.exports = router;