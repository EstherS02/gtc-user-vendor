'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./user-join.controller');

router.get('/',auth.isAuthenticated(), controller.userJoin);

module.exports = router;