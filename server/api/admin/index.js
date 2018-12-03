'use strict';

var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart
var auth = require('../../auth/auth.service');
var controller = require('./admin.controller');
const roles = require('../../config/roles');

router.get('/me', auth.hasRole(roles['ADMIN']), controller.me);
router.get('/', auth.hasRole(roles['ADMIN']), controller.index);
router.post('/', auth.hasRole(roles['ADMIN']), multipartMiddleware, controller.create);
router.put('/:id', auth.hasRole(roles['ADMIN']), multipartMiddleware, controller.edit);
router.put('/',auth.hasRole(roles['ADMIN']),controller.deleteAdmin);

module.exports = router;