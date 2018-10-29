'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./shipping-setting.controller');

var router = express.Router();

router.put('/remove-country',auth.isAuthenticated(), controller.removeCountry);
router.put('/add-country',auth.isAuthenticated(), controller.addCountry);
router.put('/vendor-update',auth.isAuthenticated(),controller.updateVendor)

module.exports = router;