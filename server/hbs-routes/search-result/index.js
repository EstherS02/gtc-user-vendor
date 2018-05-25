'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./search-result.controller');

router.get('/', controller.index);

module.exports = router;