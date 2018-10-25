'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var globalUser = require('../../auth/global-user-obj');

var controller = require('./user-verify.controller');

router.get('/',globalUser.isGlobalObj(), controller.userVerify);

module.exports = router;