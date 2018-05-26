'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./coupons.controller');

router.get('/', controller.coupons);
router.get('/edit-coupons', controller.editCoupons);


module.exports = router;