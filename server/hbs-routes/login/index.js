'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');

var controller = require('./login.controller');

router.get('/', globalUser.isGlobalObj(), controller.index);

module.exports = router;