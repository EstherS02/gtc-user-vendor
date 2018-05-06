'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./ticket.controller');

router.post('/', auth.isAuthenticated(), controller.create);

module.exports = router;