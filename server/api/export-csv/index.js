'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./export-csv.controller');


router.get('/',auth.isAuthenticated(), controller.exportcsv);


module.exports = router;