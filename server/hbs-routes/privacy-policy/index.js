'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');
var controller = require('./privacy-policy.controller');

router.get('/', globalUser.isGlobalObj(), controller.privacyPolicy);

module.exports = router;