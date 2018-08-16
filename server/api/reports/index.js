'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./reports.controller');
var permission = require('../../config/permission');

const roles = require('../../config/roles');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.generateReports);
router.get('/top-products', auth.isAuthenticated(), controller.topProducts);
router.get('/top-categories', auth.isAuthenticated(), controller.topCategories);
router.get('/top-marketplaces', auth.isAuthenticated(), controller.topMarketPlace);
router.get('/revenue-changes', auth.isAuthenticated(), controller.recentRevenueChanges);
router.get('/revenue-counts', auth.isAuthenticated(), controller.revenueChangesCount);
router.get('/performance', auth.isAuthenticated(), controller.comparePerformance);
router.get('/top-selling-cities', auth.isAuthenticated(), controller.topSellingCities);
router.get('/active-buyers', auth.isAuthenticated(), controller.topActiveBuyers);

module.exports = router;