'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./lifestyle.controller');

router.get('/', controller.lifestyle);


module.exports = router;