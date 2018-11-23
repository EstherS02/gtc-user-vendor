'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var controller = require('./advertisement.controller');

router.post('/', auth.isAuthenticated(), multipartMiddleware, controller.createAd);
router.put('/:id', auth.isAuthenticated(), multipartMiddleware, controller.editAd);

module.exports = router;