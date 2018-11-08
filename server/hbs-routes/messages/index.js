'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
const roles = require('../../config/roles');

var controller = require('./messages.controller');

router.get('/', auth.hasRole(roles['USER']), controller.messages);

module.exports = router;