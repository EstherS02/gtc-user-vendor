'use strict';

var express = require('express');
var router = express.Router();
var globalUser = require('../../auth/global-user-obj');

var controller = require('./geo-locate.controller');

router.get('/', globalUser.isGlobalObj(), controller.geoLocate);
router.get('/search', globalUser.isGlobalObj(), controller.geoLocateSearch);

module.exports = router;
