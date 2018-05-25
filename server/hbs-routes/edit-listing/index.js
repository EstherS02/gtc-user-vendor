'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./edit-listing.controller');

router.get('/', controller.editListing);


module.exports = router;
