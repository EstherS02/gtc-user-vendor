'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./wishlist.controller');

router.put('/remove', controller.remove);
router.put('/cart', controller.cart);


module.exports = router;