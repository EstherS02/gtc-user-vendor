'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./bulk-plan-renewal.controller');

router.get('/', controller.bulkPlanRenewal);

module.exports = router;
