'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./upgrade-plan.controller');

router.get('/', auth.isAuthenticated(), controller.upgradeplan);
router.get('/userBulkupgradePlan', auth.isAuthenticated(), controller.userBulkupgradePlan);


module.exports = router;