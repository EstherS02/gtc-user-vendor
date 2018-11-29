'use strict';

var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service');
var controller = require('./vendor.controller');

router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/',auth.hasRole(roles['ADMIN']),controller.index);
router.post('/delete',auth.hasRole(roles['ADMIN']),controller.deleteVendor);
router.post('/create-vendor', auth.hasRole(roles['ADMIN']), auth.isEmailVerified(), auth.isAccountActive(), multipartMiddleware, controller.createVendor);
router.post('/starter-seller', auth.hasRole(roles['USER']), auth.isEmailVerified(), auth.isAccountActive(), multipartMiddleware, controller.createStarterSeller);
router.post('/',auth.hasRole(roles['VENDOR']), controller.create);
router.put('/:id',auth.hasRole(roles['VENDOR']), controller.edit);
router.put('/',auth.hasRole(roles['ADMIN']),controller.deleteVendor)

module.exports = router;