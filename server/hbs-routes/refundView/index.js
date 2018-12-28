'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service')

var controller = require('./refundView.controller');

router.get('/',auth.hasRole(roles['VENDOR']), controller.refund);

module.exports = router;