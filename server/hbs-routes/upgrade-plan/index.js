'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var roles = require('../../config/roles');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');


/* Handlebars routes */
var controller = require('./upgrade-plan.controller');

router.get('/', auth.hasRole(roles['USER']), controller.upgradeplan);
router.get('/userBulkupgradePlan', auth.isAuthenticated(), controller.userBulkupgradePlan);


module.exports = router;