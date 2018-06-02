'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var globalUser = require('../../auth/global-user-obj');


/* Handlebars routes */
var controller = require('./lifestyle.controller');

router.get('/',globalUser.isGlobalObj(), controller.lifestyle);


module.exports = router;