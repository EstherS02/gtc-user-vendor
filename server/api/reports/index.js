'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./reports.controller');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.generateReports);
router.get('/top-products', auth.isAuthenticated(), controller.topProducts);
router.get('/top-categories', auth.isAuthenticated(), controller.topCategories);
router.get('/top-marketplaces', auth.isAuthenticated(), controller.topMarketPlace);
router.get('/top-cities', auth.isAuthenticated(), controller.topSellingCities);
router.get('/top-countries', auth.isAuthenticated(), controller.topSellingCountries);
router.get('/top-vendors', auth.isAuthenticated(),controller.vendorPerformance);
router.get('/top-buyers', auth.isAuthenticated(),controller.topBuyers);
router.get('/revenue-changes', auth.isAuthenticated(), controller.recentRevenueChanges);
router.get('/revenue-counts', auth.isAuthenticated(), controller.revenueChangesCount);
router.get('/performance', auth.isAuthenticated(), controller.comparePerformance);
router.get('/active-buyers', auth.isAuthenticated(), controller.topActiveBuyers);
router.get('/latest-tickets', auth.isAuthenticated(), controller.latestTickets);
router.get('/latest-refunds', auth.isAuthenticated(), controller.latestRefunds);
router.get('/vendor-trail', auth.isAuthenticated(), controller.vendorTrail);
router.get('/accounting', auth.isAuthenticated(), controller.accounting);
router.get('/membership-fee',auth.isAuthenticated(), controller.memberShipFees);
router.get('/product-performance', auth.isAuthenticated(), controller.productPerformanceChanges);//productPerformanceChanges);//
router.get('/category-performance', auth.isAuthenticated(), controller.compareCategoryPerformance);
router.get('/marketplace-performance', auth.isAuthenticated(), controller.compareMarketPlacePerformance);
router.get('/city-performance', auth.isAuthenticated(), controller.compareCityPerformance);
router.get('/country-performance', auth.isAuthenticated(), controller.compareCountriesPerformance);
router.get('/user-performance', auth.isAuthenticated(), controller.compareUserPerformance);

module.exports = router;