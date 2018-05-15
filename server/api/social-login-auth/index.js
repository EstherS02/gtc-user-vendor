'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./social-login-auth.controller');

var router = express.Router();

router.get('/', controller.twitterAuth);
router.get('/callback', controller.twitterCallbackAuth);

module.exports = router;