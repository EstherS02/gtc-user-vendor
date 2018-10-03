'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');
var globalUser = require('../../auth/global-user-obj');

var controller = require('./compare.controller');

router.get('/', globalUser.isGlobalObjUser(), controller.compare);

module.exports = router;