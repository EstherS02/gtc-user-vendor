'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./ticket.controller');

router.post('/', auth.isAuthenticatedUser(), controller.create);
router.post('/:id', auth.isAuthenticatedUser(), controller.update);

module.exports = router;