'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var globalUser = require('../../auth/global-user-obj');


/* Handlebars routes */
var controller = require('./product-view.controller');

router.get('/:product_slug/:product_id', globalUser.isGlobalObj(), controller.GetProductDetails);
//router.get('/:product_slug/:product_id', controller.productView);


module.exports = router;
