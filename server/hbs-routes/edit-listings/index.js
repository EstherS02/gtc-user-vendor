'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./edit-listings.controller');

router.get('/', controller.editListings);


module.exports = router;
