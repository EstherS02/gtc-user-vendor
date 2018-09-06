'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./export-csv.controller');


router.get('/',auth.isAuthenticated(), controller.exportcsv);
router.post('/orderhistorycsv', controller.orderHistoryexportcsv);
router.post('/saleshistorycsv', controller.salesHistoryexportcsv);

module.exports = router;