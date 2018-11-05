'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./order-track.controller');

router.get('/:id',auth.isAuthenticated(), controller.orderTrack);
router.get('/',auth.isAuthenticated(), controller.orderTrack);

module.exports = router;