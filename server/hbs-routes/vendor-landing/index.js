'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var auth = require('../../auth/auth.service');


/* Handlebars routes */
var controller = require('./vendor-landing.controller');

router.get('/',auth.isAuthenticated(), controller.vendorLanding);


module.exports = router;