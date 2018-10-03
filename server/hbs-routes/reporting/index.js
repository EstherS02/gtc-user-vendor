'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var roles = require('../../config/roles');
var auth = require('../../auth/auth.service');

var accountingCtrl = require('./accounting/accounting.controller');
var taxCtrl = require('./accounting/tax/tax.controller');
var landingCtrl = require('./landing/landing.controller');
var performanceCtrl = require('./performance/performance.controller');
var saleshistoryCtrl = require('./sales-history/sales-history.controller');

router.get('/', auth.isAuthenticated(), landingCtrl.reporting);
router.get('/performance', auth.isAuthenticated(), performanceCtrl.performance);
router.get('/sales-history', auth.isAuthenticated(), saleshistoryCtrl.salesHistory);
router.get('/sales-history/:id', auth.isAuthenticated(), saleshistoryCtrl.orderView);
router.get('/accounting', auth.hasRole(roles['VENDOR']), accountingCtrl.accounting);
router.get('/tax', auth.isAuthenticated(), taxCtrl.tax);
router.get('/order', auth.isAuthenticated(), saleshistoryCtrl.salesHistory);
router.get('/order/:id', auth.isAuthenticated(), saleshistoryCtrl.orderView);

module.exports = router;