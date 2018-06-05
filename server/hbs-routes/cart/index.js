'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service')
var globalUser = require('../../auth/global-user-obj');


/* Handlebars routes */
var controller = require('./cart.controller');

router.get('/', auth.isAuthenticated(), controller.cart);


module.exports = router;
