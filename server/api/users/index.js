'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./users.controller');

router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/', auth.isAuthenticated(), controller.index);
router.post('/', controller.create);
router.put('/user-authenticate', controller.userAuthenticate);
router.put('/change-password', auth.isAuthenticated() , controller.changePassword);
router.put('/user-profile', auth.isAuthenticated() , controller.userProfile);
router.put('/user-vendor-follow', auth.isAuthenticated() , controller.vendorFollow);
router.get('/forgot-password/:email',controller.forgotPassword);
router.put('/reset-password',controller.resetPassword);

module.exports = router;