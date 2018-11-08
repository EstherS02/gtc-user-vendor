'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var roles = require('../../config/roles');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

var controller = require('./user-profile.controller');

router.get('/my-profile', auth.hasRole(roles['USER']), controller.userProfile);
router.get('/forgot-password', controller.forgotPassword);
router.get('/reset-password', controller.resetPassword);

module.exports = router;