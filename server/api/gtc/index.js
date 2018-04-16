'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./gtc.controller');
var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.get('/:endpoint', middleware.validateEndpoint(), controller.index);
router.post('/:endpoint', middleware.validateEndpoint(), controller.create);

module.exports = router;
