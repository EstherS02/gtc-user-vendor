'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');

var controller = require('./lifestyle.controller');

router.get('/', globalUser.isGlobalObj(), controller.lifestyle);

module.exports = router;