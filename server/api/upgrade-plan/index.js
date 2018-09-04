'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./upgrade-plan.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.post('/selectplan', controller.selectVendorplan);

module.exports = router;