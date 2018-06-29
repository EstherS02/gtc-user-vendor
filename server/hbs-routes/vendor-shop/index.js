'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');


/* Handlebars routes */
var controller = require('./vendor-shop.controller');

router.get('/:id',auth.isAuthenticated(), controller.vendorShop);


module.exports = router;