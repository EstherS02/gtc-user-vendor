'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');


/* Handlebars routes */
var controller = require('./advertisement.controller');

router.get('/add', auth.isAuthenticated(), controller.adForm);
router.get('/', auth.isAuthenticated(), controller.adList);

module.exports = router;