'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./users.controller');

router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/user-orders', controller.orderUsers);
router.get('/', auth.isAuthenticated(), controller.index);
router.post('/', controller.create);
router.delete('/:ids', controller.destroy);

module.exports = router;