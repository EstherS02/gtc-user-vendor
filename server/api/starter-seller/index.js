'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./starter-seller.controller');

router.get('/', controller.starterSellerExpires);

module.exports = router;
