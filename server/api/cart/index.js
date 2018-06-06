'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./cart.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/add-cart/:id', auth.isAuthenticated(), controller.addToCart);
router.delete('/remove-cart/:id', auth.isAuthenticated(), controller.removeCart);
router.put('/update-cart/:id', auth.isAuthenticated(), controller.updateCart);

module.exports = router;