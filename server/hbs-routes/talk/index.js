'use strict';

var express = require('express');
var router = express.Router();
var roles = require('../../config/roles');
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

/* Handlebars routes */
var controller = require('./talk.controller');

router.get('/', auth.hasRole(roles['VENDOR']), controller.talk);
router.get('/chat', auth.hasRole(roles['VENDOR']), controller.chat);


module.exports = router;