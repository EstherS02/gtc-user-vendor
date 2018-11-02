'use strict';

var express = require('express');
var router = express.Router();
var roles = require('../../config/roles');
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

var inboxCtrl = require('./inbox/inbox.controller');
var sentCtrl = require('./sent/sent.controller');
var draftsCtrl = require('./drafts/drafts.controller');
var deletedCtrl = require('./deleted/deleted.controller');
var settingsCtrl = require('./mail-settings/mail-settings.controller');

router.get('/inbox', auth.hasRole(roles['USER']), inboxCtrl.inbox);
router.get('/:path/:id', auth.hasRole(roles['USER']), inboxCtrl.message);
router.get('/sent', auth.hasRole(roles['USER']), sentCtrl.sent);
router.get('/drafts', auth.hasRole(roles['USER']), draftsCtrl.drafts);
router.get('/deleted', auth.hasRole(roles['USER']), deletedCtrl.deleted);
router.get('/compose', auth.hasRole(roles['USER']), inboxCtrl.compose);
router.get('/mail-settings', auth.hasRole(roles['VENDOR']), settingsCtrl.mailSettings);

module.exports = router;