'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');

var controller = require('./products.controller');

router.get('/', globalUser.isGlobalObj(), controller.products);

module.exports = router;