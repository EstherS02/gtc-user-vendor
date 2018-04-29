'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./admin.controller');

router.get('/me', auth.isAuthenticated(), controller.me);
router.post('/', controller.create);

module.exports = router;