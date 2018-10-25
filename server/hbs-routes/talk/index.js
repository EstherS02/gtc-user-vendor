'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./talk.controller');

router.get('/', auth.isAuthenticated(), controller.talk);
router.get('/chat', auth.isAuthenticated(), controller.chat);


module.exports = router;