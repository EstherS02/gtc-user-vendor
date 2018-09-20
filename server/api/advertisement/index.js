'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();



/* Handlebars routes */
var controller = require('./advertisement.controller');

router.post('/', auth.isAuthenticated(), multipartMiddleware, controller.storeForm);

module.exports = router;