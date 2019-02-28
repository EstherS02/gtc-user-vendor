'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./export-csv.controller');

router.get('/orders-csv', auth.isAuthenticated(),controller.myOrderHistoryexportcsv);
router.get('/personal-orders-csv', auth.isAuthenticated(),controller.orderHistoryexportcsv);
router.get('/listings-csv',auth.isAuthenticated(), controller.exportcsv);
router.post('/saleshistorycsv',auth.isAuthenticated(), controller.salesHistoryexportcsv);
router.get('/export-vendors-performance',auth.isAuthenticated(), controller.vendorPerformancecsv);
router.get('/export-product-performance',auth.isAuthenticated(), controller.productPerformanceChangescsv);
router.get('/export-category-performance',auth.isAuthenticated(), controller.compareCategoryPerformancecsv);
router.get('/export-marketplace-performance',auth.isAuthenticated(), controller.compareMarketPlacePerformancecsv);
router.get('/export-city-performance',auth.isAuthenticated(), controller.compareCityPerformancecsv);
router.get('/export-country-performance',auth.isAuthenticated(), controller.compareCountriesPerformancecsv);
router.get('/export-user-performance',auth.isAuthenticated(), controller.compareUserPerformancecsv);

module.exports = router;