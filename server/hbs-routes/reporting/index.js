'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');


/* Handlebars routes */
var controller = require('./reporting.controller');

router.get('/',auth.isAuthenticated(), controller.reporting);
router.get('/performance',auth.isAuthenticated(), controller.performance);
router.get('/sales-history',auth.isAuthenticated(), controller.salesHistory);
router.get('/accounting',auth.isAuthenticated(), controller.accounting);
router.get('/tax',auth.isAuthenticated(), controller.tax);

module.exports = router;