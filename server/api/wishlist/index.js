'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./wishlist.controller');

router.put('/remove', auth.isAuthenticated(), controller.remove);
router.put('/cart', auth.isAuthenticated(), controller.cart);
router.get('/delete', auth.isAuthenticated(), controller.deleteAll);


module.exports = router;