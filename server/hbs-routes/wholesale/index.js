'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var globalUser = require('../../auth/global-user-obj');

var controller = require('./wholesale.controller');

//router.get('/:marketPlaceType/:productSlugName', controller.wholeSaleProductView)
router.get('/', globalUser.isGlobalObj(), controller.wholesale);

module.exports = router;