'use strict';

var express = require('express');
var router = express.Router();
var roles = require('../../config/roles');
var auth = require('../../auth/auth.service');

var accountingCtrl = require('./accounting/accounting.controller');
var taxCtrl = require('./accounting/tax/tax.controller');
var landingCtrl = require('./landing/landing.controller');
var performanceCtrl = require('./performance/performance.controller');
var saleshistoryCtrl = require('./sales-history/sales-history.controller');

router.get('/reports', auth.hasRole(roles['VENDOR']), landingCtrl.reporting);
router.get('/performance', auth.hasRole(roles['VENDOR']), performanceCtrl.performance);
router.get('/sales-history', auth.hasRole(roles['VENDOR']), saleshistoryCtrl.salesHistory);
router.get('/sales-history/:id', auth.hasRole(roles['VENDOR']), saleshistoryCtrl.orderView);
router.get('/accounting', auth.hasRole(roles['VENDOR']), accountingCtrl.accounting);
router.get('/tax', auth.hasRole(roles['VENDOR']), taxCtrl.tax);
router.get('/order', auth.hasRole(roles['VENDOR']), saleshistoryCtrl.myOrder);
router.get('/order/:id', auth.hasRole(roles['VENDOR']), saleshistoryCtrl.orderView);
router.get('/revenue', auth.hasRole(roles['VENDOR']), accountingCtrl.revenue);
router.get('/processing', auth.hasRole(roles['VENDOR']), accountingCtrl.processing);
router.get('/plan-fees', auth.hasRole(roles['VENDOR']), accountingCtrl.subscription);
router.get('/gtcpay', auth.hasRole(roles['VENDOR']), accountingCtrl.gtcpay);
router.get('/membership', auth.hasRole(roles['VENDOR']), accountingCtrl.membership);

module.exports = router;