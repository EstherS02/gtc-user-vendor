'use strict';

var express = require('express');
var router = express.Router();
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service');
var controller = require('./vendor-props.controller');

router.post('/blog-like', auth.isAuthenticated(), controller.blogLike);

module.exports = router;