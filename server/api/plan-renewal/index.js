'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./plan-renewal.controller');

router.get('/', controller.planRenewal);

module.exports = router;


