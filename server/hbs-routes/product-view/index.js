'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');
var controller = require('./product-view.controller');

router.get('/:product_slug/:product_id', globalUser.isGlobalObj(), controller.product);
router.get('/:product_slug/:product_id/reviews', globalUser.isGlobalObj(), controller.GetProductReview);

module.exports = router;