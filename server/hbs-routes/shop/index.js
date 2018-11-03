'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');

var controller = require('./shop.controller');

router.get('/', globalUser.isGlobalObj(), controller.shop);

module.exports = router;