'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
const roles = require('../../config/roles');
var controller = require('./users.controller');

router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/',auth.hasRole(roles['ADMIN']), controller.index);
router.post('/', controller.create);
router.post('/resend', auth.isAuthenticatedUser(), controller.resend);
router.put('/user-authenticate', controller.userAuthenticate);
router.put('/change-password', auth.isAuthenticated(), controller.changePassword);
router.put('/user-profile', auth.isAuthenticated(), controller.userProfile);
router.put('/user-vendor-follow', auth.isAuthenticatedUser(), controller.vendorFollow);
router.get('/forgot-password/:email', controller.forgotPassword);
router.put('/reset-password', controller.resetPassword);
router.put('/:id',auth.isAuthenticated(), controller.edit);

module.exports = router;