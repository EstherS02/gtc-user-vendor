'use strict';

var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var auth = require('../../auth/auth.service');
var controller = require('./verification.controller');
var multipartMiddleware = multipart();


// router.post('/working-hours', controller.workingHours);
router.post('/store', auth.isAuthenticated() ,multipartMiddleware, controller.storeData);
router.put('/store/:id', auth.isAuthenticated() ,multipartMiddleware, controller.updateData);
//router.post('/add-vendor', auth.isAuthenticated() , controller.addVendor);

module.exports = router;