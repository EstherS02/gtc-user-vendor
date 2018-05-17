'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./homePage.controller');

router.get('/', controller.homePage);


module.exports = router;
