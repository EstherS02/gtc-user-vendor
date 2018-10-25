'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

var inboxCtrl = require('./inbox/inbox.controller');
var sentCtrl = require('./sent/sent.controller');
var draftsCtrl = require('./drafts/drafts.controller');
var deletedCtrl = require('./deleted/deleted.controller');
var settingsCtrl = require('./mail-settings/mail-settings.controller');

router.get('/inbox', auth.isAuthenticated(), inboxCtrl.inbox);
router.get('/:path/:id', auth.isAuthenticated(), inboxCtrl.message);
router.get('/sent', auth.isAuthenticated(), sentCtrl.sent);
router.get('/drafts', auth.isAuthenticated(), draftsCtrl.drafts);
router.get('/deleted', auth.isAuthenticated(), deletedCtrl.deleted);
router.get('/compose',auth.isAuthenticated(),inboxCtrl.compose);
router.get('/mail-settings',auth.isAuthenticated(),settingsCtrl.mailSettings);


module.exports = router;