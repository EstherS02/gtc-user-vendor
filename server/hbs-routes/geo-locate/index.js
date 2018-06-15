'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var globalUser = require('../../auth/global-user-obj');


/* Handlebars routes */
var controller = require('./geo-locate.controller');

router.get('/', globalUser.isGlobalObj(), controller.geoLocate);


module.exports = router;
