'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./users.controller');

router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/', controller.index);
router.post('/', controller.create);
router.post('/resend', auth.isAuthenticatedUser(), controller.resend);
router.put('/user-authenticate', controller.userAuthenticate);
router.put('/change-password', auth.isAuthenticated(), controller.changePassword);
router.put('/user-profile', auth.isAuthenticated(), controller.userProfile);
router.put('/user-vendor-follow', auth.isAuthenticatedUser(), controller.vendorFollow);
router.get('/forgot-password/:email', controller.forgotPassword);
router.put('/reset-password', controller.resetPassword);
router.put('/contact-email', auth.isAuthenticated(), controller.updateContactEmail);

module.exports = router;