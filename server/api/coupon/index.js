'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./coupon.controller');
var permission = require('../../config/permission');
const roles = require('../../config/roles');

var router = express.Router();

router.post('/save', auth.hasRole(roles['VENDOR']), controller.saveCoupon);
router.put('/update-status', controller.updateStatus);
router.put('/update', controller.updateCoupon);

module.exports = router;