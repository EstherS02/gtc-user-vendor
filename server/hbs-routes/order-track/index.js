'use strict';

var express = require('express');
var router = express.Router();
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service');

var controller = require('./order-track.controller');

router.get('/:id', auth.hasRole(roles['USER']), controller.orderTrack);
router.get('/', auth.hasRole(roles['USER']), controller.orderTrack);

module.exports = router;