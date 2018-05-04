'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./product.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.get('/', controller.index);
// router.put('/:endpoint/delete', middleware.validateEndpoint(), controller.destroyMany);
// router.put('/:endpoint/delete/:id', middleware.validateEndpoint(), controller.destroy);


module.exports = router;