'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./promote-store.controller');

router.get('/',auth.isAuthenticated(), controller.promoteStore);

module.exports = router;