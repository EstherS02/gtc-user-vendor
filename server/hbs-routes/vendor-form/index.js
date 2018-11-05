'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./vendor-form.controller');

router.get('/', auth.isAuthenticatedUser(), controller.vendorForm);

module.exports = router;