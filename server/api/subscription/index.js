'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./subscription.controller');

router.get('/', controller.subscription);

module.exports = router;