'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./talk.controller');

router.post('/working-hours', controller.workingHours);


module.exports = router;