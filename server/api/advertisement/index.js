'use strict';

var express = require('express');
var router = express.Router();
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var controller = require('./advertisement.controller');

router.get('/',auth.hasRole(roles['ADMIN']),controller.index);
router.post('/', auth.isAuthenticated(), multipartMiddleware, controller.createAd);
router.put('/:id', auth.isAuthenticated(), multipartMiddleware, controller.editAd);

module.exports = router;