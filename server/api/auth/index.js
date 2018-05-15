'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./auth.controller');

var router = express.Router();

router.get('/auth/twitter', controller.twitterAuth);
router.get('/auth/twitter/callback', controller.twitterCallbackAuth);

router.post('/login', controller.login);
router.post('/refresh-token', controller.refreshToken);
router.post('/logout', auth.isAuthenticated(), controller.logout);

module.exports = router;