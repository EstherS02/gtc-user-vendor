'use strict';

var express = require('express');
var router = express.Router();
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service');
var controller = require('./vendor.controller');

router.get('/me', auth.isAuthenticated(), controller.me);
router.post('/starter-seller', auth.hasRole(roles['USER']), controller.createStarterSeller);
router.post('/', controller.create);

module.exports = router;