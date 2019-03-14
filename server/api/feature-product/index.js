'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./feature-product.controller');
const roles = require('../../config/roles');
var globalUser = require('../../auth/global-user-obj');

var router = express.Router();

router.get('/',auth.hasRole(roles['ADMIN']), controller.index);
router.post('/payment', auth.isAuthenticated(), controller.featureProductWithPayment);
router.post('/', auth.isAuthenticated(), controller.featureProductWithoutPayment);
router.put('/click/:id', globalUser.isGlobalObj(), controller.adClick);
router.put('/featureClick/:id', globalUser.isGlobalObj(), controller.featureClick);

module.exports = router;