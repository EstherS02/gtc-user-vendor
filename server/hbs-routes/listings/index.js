'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./listings.controller');

router.get('/', controller.listings);
router.get('/:product_slug', controller.editListings);


module.exports = router;