'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./wishlist.controller');

router.get('/', auth.isAuthenticatedUserPlan(), controller.wishlist);

module.exports = router;