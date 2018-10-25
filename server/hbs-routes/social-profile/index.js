'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./social-profile.controller');

router.get('/',auth.isAuthenticated(), controller.socialProfile);

module.exports = router;