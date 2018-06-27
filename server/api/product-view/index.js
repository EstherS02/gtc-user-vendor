'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./product-view.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.put('/addOrRemove', controller.addOrRemoveWishlist);
router.put('/vendor-follow', controller.vendorFollow);
// router.put('/vendor-update',controller.updateVendor)

module.exports = router;