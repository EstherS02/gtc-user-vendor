'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./notifications.controller');

router.get('/', controller.notifications);
// var router = express.Router();

router.get('/vendor-user-product', controller.notifications);

module.exports = router;
