'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./feature-product.controller');
const roles = require('../../config/roles');

var router = express.Router();

router.get('/',auth.hasRole(roles['ADMIN']), controller.index);
router.post('/payment', auth.isAuthenticated(), controller.featureProductWithPayment);
router.post('/', auth.isAuthenticated(), controller.featureProductWithoutPayment);

module.exports = router;