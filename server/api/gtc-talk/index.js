'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./talk.controller');

router.post('/working-hours', controller.workingHours);
router.post('/store', controller.storeData);


module.exports = router;