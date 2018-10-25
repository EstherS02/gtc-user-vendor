'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./reviews.controller');

router.get('/', auth.isAuthenticated(), controller.reviews);

module.exports = router;