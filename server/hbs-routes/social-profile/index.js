'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var roles = require('../../config/roles');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');


/* Handlebars routes */
var controller = require('./social-profile.controller');

router.get('/', auth.hasRole(roles['VENDOR']), controller.socialProfile);


module.exports = router;