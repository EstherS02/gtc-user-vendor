'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./search-result.controller');
var globalUser = require('../../auth/global-user-obj');

router.get('/', globalUser.isGlobalObj(), controller.index);

module.exports = router;