'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');


/* Handlebars routes */
var controller = require('./promote-store.controller');

router.get('/',auth.isAuthenticated(), controller.promoteStore);


module.exports = router;