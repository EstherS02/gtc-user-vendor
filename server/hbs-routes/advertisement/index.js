'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
const roles = require('../../config/roles');

var controller = require('./advertisement.controller');

router.get('/add', auth.hasRole(roles['VENDOR']), controller.adForm);
router.get('/add/:id', auth.hasRole(roles['VENDOR']), controller.adForm);
router.get('/', auth.hasRole(roles['VENDOR']), controller.adList);

module.exports = router;