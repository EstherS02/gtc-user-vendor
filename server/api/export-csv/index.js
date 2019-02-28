'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./export-csv.controller');

router.get('/orders-csv', auth.isAuthenticated(),controller.myOrderHistoryexportcsv);
router.get('/personal-orders-csv', auth.isAuthenticated(),controller.orderHistoryexportcsv);
router.get('/listings-csv',auth.isAuthenticated(), controller.exportcsv);
router.post('/saleshistorycsv',auth.isAuthenticated(), controller.salesHistoryexportcsv);
// router.get('/export-vendors-performance',auth.isAuthenticated(), controller.vendorPerformancecsv);
router.get('/export-product-performance',auth.isAuthenticated(), controller.productPerformanceChangescsv);

module.exports = router;