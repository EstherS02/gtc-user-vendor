'use strict';

var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service');
var controller = require('./vendor.controller');

router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/',controller.index);//auth.hasRole(roles['ADMIN'])
router.post('/starter-seller', auth.hasRole(roles['USER']), auth.isEmailVerified(), auth.isAccountActive(), multipartMiddleware, controller.createStarterSeller);
router.post('/', controller.create);


module.exports = router;