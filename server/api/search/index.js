'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./search.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');
var globalUser = require('../../auth/global-user-obj');

var router = express.Router();

router.get('/', globalUser.isGlobalObj(), controller.search);


module.exports = router;