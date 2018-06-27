'use strict';

var express = require('express');
var multipart = require('connect-multiparty');
var router = express.Router();
var multipartMiddleware = multipart();

var auth = require('../../auth/auth.service');
var controller = require('./gtc.controller');
var middleware = require('../../middleware');
var permission = require('../../config/permission');

router.post('/:endpoint/upload', auth.isAuthenticated(), multipartMiddleware, controller.upload);
router.post('/:endpoint/multiple', auth.isAuthenticated(), multipartMiddleware, controller.multipleUpload);
router.get('/:endpoint', middleware.validateEndpoint(), controller.index);
router.get('/:endpoint/show', middleware.validateEndpoint(), controller.show);
router.get('/:endpoint/:id', middleware.validateEndpoint(), controller.findById);
router.post('/:endpoint/bulk-create', middleware.validateEndpoint(), controller.createBulk);
router.post('/:endpoint', middleware.validateEndpoint(), controller.create);
router.put('/:endpoint/delete', middleware.validateEndpoint(), controller.destroyMany);
router.put('/:endpoint/:id', middleware.validateEndpoint(), controller.update);
router.put('/:endpoint/delete/:id', middleware.validateEndpoint(), controller.destroy);

module.exports = router;