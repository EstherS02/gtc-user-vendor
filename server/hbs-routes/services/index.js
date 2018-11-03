'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');

var controller = require('./services.controller');

router.get('/', globalUser.isGlobalObj(), controller.services);


module.exports = router;