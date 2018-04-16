'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./gtc.controller');
var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.get('/:endpoint', middleware.validateEndpoint(), controller.index);
router.get('/:endpoint/show', middleware.validateEndpoint(), controller.show);
router.get('/:endpoint/:id', middleware.validateEndpoint(), controller.findById);
router.post('/:endpoint', middleware.validateEndpoint(), controller.create);
router.put('/:endpoint', middleware.validateEndpoint(), controller.update);
router.put('/:endpoint/:id', middleware.validateEndpoint(), controller.softDelete);
router.delete('/:endpoint/:id', middleware.validateEndpoint(), controller.destroy);

module.exports = router;
