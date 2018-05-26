'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./cart.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.post('/add-cart/:id', controller.addToCart);
router.delete('/remove-cart/:id', controller.removeCart);
router.put('/update-cart/:id', controller.updateCart);

module.exports = router;