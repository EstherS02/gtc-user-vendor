'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./refund.controller');

router.get('/:id',auth.isAuthenticated(), controller.refund);

module.exports = router;