'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./product-view.controller');
var permission = require('../../config/permission');

var router = express.Router();

router.post('/add-to-compare', controller.AddToCompare);
router.post('/remove-from-compare', controller.removeFromCompare);
router.put('/addOrRemove', controller.addOrRemoveWishlist);
router.post('/vendor-question',auth.isAuthenticated(), controller.vendorQuestion);

module.exports = router;