'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./auth.controller');

var router = express.Router();

router.get('/request-twitter', controller.requestTwitter);
router.get('/linkedin', controller.linkedin);
router.get('/facebook', controller.facebook);
router.get('/twitter', controller.twitter);
router.post('/login', controller.login);
router.post('/refresh-token', controller.refreshToken);
router.post('/logout', auth.isAuthenticated(), controller.logout);

module.exports = router;