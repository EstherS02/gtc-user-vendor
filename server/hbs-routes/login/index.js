'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./login.controller');

router.get('/', controller.index);

module.exports = router;