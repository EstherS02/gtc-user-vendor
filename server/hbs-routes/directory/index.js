'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');

var controller = require('./directory.controller');

router.get('/', globalUser.isGlobalObj(), controller.directory);

module.exports = router;
