'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var auth = require('../../auth/auth.service');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./messages.controller');

router.get('/', auth.isAuthenticated(), controller.messages);
// var router = express.Router();

module.exports = router;