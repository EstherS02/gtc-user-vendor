'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./order-history.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.put('/update-status', controller.updateStatus);
// router.put('/add-country', controller.addCountry);
// router.put('/vendor-update',controller.updateVendor)

module.exports = router;