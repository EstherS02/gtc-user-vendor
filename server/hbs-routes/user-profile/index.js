'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./user-profile.controller');

router.get('/', controller.userProfile);


module.exports = router;