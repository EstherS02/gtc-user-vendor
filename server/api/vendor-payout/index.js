'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./vendor-payout.controller');

router.post('/', controller.vendorPayout);

module.exports = router;