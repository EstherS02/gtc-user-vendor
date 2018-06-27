'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./shipping-setting.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.put('/remove-country', controller.removeCountry);
router.put('/add-country', controller.addCountry);
router.put('/vendor-update',controller.updateVendor)

module.exports = router;