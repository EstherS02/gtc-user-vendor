'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./upgrade-plan.controller');

var router = express.Router();

router.get('/selectplan/:id', controller.selectVendorplan);

module.exports = router;