'use strict';

var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var auth = require('../../auth/auth.service');
var controller = require('./verification.controller');
var multipartMiddleware = multipart();
var permission = require('../../config/permission');
const roles = require('../../config/roles');

router.post('/store', auth.isAuthenticated() ,multipartMiddleware, controller.storeData);
router.put('/store/:id', auth.isAuthenticated() ,multipartMiddleware, controller.updateData);
router.put('/update/:id', auth.hasRole(roles['ADMIN']),controller.updateStatus);

module.exports = router;