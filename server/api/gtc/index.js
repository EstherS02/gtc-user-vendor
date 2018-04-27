'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./gtc.controller');
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../admin-auth/auth.service');

var router = express.Router();

router.get('/:endpoint', middleware.validateEndpoint(), auth.isAuthenticated(), controller.index);
router.get('/:endpoint/show', middleware.validateEndpoint(), controller.show);
router.get('/:endpoint/:id', middleware.validateEndpoint(), controller.findById);
router.post('/:endpoint', middleware.validateEndpoint(), controller.create);
router.put('/:endpoint/:id', middleware.validateEndpoint(), controller.update);
router.put('/:endpoint/:id/delete', middleware.validateEndpoint(), controller.softDelete);
router.delete('/:endpoint/:id', middleware.validateEndpoint(), controller.destroy);

module.exports = router;
