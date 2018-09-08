'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./talk.controller');

router.get('/talk-count', auth.isAuthenticated(), controller.talkCounts);
module.exports = router;