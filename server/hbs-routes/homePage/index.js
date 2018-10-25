'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');

var controller = require('./homePage.controller');

router.get('/', globalUser.isGlobalObj(), controller.homePage);

module.exports = router;