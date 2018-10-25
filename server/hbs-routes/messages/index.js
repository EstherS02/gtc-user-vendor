'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./messages.controller');

router.get('/', auth.isAuthenticated(),controller.messages);

module.exports = router;