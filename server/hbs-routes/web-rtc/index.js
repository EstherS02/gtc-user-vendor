'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../../auth/auth.service');
const roles = require('../../config/roles');

const controller = require('./webrtc.controller');

router.get('/:videoCallId', auth.hasRole(roles['USER']), controller.webRTC);

module.exports = router;