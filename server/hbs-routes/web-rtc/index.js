'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var controller = require('./webrtc.controller');

router.get('/:videoCallId', auth.isAuthenticated(), controller.webRTC);

module.exports = router;