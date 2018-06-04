'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service')
var globalUser = require('../../auth/global-user-obj');

/* Handlebars routes */
var controller = require('./user-profile.controller');

router.get('/', auth.isAuthenticated(), controller.userProfile);


module.exports = router;