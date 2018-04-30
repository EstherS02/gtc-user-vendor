'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./vendor.controller');

router.get('/me', controller.me);
router.post('/', controller.create);

module.exports = router;