'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./advertisement.controller');

router.get('/add', auth.isAuthenticated(), controller.adForm);
router.get('/add/:id', auth.isAuthenticated(), controller.adForm);
router.get('/', auth.isAuthenticated(), controller.adList);

module.exports = router;