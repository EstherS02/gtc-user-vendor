'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./order-history.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');
var roles = require('../../config/roles')
var router = express.Router();

router.put('/:id', auth.hasRole(roles['VENDOR']), controller.updateStatus);
router.post('/vendor-cancel/:id', controller.vendorCancel);
router.put('/return-request/:id', auth.isAuthenticated(),controller.returnRequest);
// router.put('/add-country', controller.addCountry);
// router.put('/vendor-update',controller.updateVendor)

module.exports = router;