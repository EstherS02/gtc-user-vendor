'use strict';

var express = require('express');
var controller = require('./gtc.controller');

var router = express.Router();

router.get('/:entity_end_point', controller.index);

module.exports = router;
