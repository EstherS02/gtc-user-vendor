'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service')
var globalUser = require('../../auth/global-user-obj');


/* Handlebars routes */
var controller = require('./listings.controller');

router.get('/:type',  auth.isAuthenticated(), controller.listings);
router.get('/edit/:product_slug', controller.editListings);


module.exports = router;
