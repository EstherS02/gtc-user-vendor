'use strict';

var express = require('express');
var router = express.Router();
var controller = require('./appclients.controller');

router.post('/', controller.create);

module.exports = router;
