'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');


var inboxCtrl = require('./inbox/inbox.controller');
var sentCtrl = require('./sent/sent.controller');
var draftsCtrl = require('./drafts/drafts.controller');
var deletedCtrl = require('./deleted/deleted.controller');


router.get('/inbox', auth.isAuthenticated(), inboxCtrl.inbox);
router.get('/sent', auth.isAuthenticated(), sentCtrl.sent);
router.get('/drafts', auth.isAuthenticated(), draftsCtrl.drafts);
router.get('/deleted', auth.isAuthenticated(), deletedCtrl.deleted);
router.get('/compose',auth.isAuthenticated(),inboxCtrl.compose);


module.exports = router;