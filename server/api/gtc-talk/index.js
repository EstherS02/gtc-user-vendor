'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./talk.controller');
var chatcontroller = require('./chat.controller');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.post('/working-hours',auth.isAuthenticated(), controller.workingHours);
router.post('/store',multipartMiddleware, auth.isAuthenticated(), controller.storeData);
router.post('/chat-conversation', auth.isAuthenticated(), chatcontroller.chatConversation);

module.exports = router;