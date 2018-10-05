'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./order.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.get('/:id', controller.orderItemdetails);

module.exports = router;