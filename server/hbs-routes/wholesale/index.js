'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');

var controller = require('./wholesale.controller');

router.get('/', globalUser.isGlobalObj(), controller.wholesale);

module.exports = router;