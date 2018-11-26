'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./admin.controller');
const roles = require('../../config/roles');

router.get('/me', auth.hasRole(roles['ADMIN']), controller.me);
router.get('/', auth.hasRole(roles['ADMIN']), controller.index);
router.post('/', controller.create);
router.put('/:id', auth.isAuthenticated(), controller.edit);

//auth.hasRole(roles['ADMIN'])

module.exports = router;