'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./talk.controller');

router.post('/talk-check', auth.isAuthenticated(), controller.talkCheck);
module.exports = router;