'use strict';

var express = require('express');
var router = express.Router();
const roles = require('../../config/roles');
var auth = require('../../auth/auth.service');
var controller = require('./vendor-info.controller');

router.put('/terms-and-conditions', auth.isAuthenticated(), controller.upsert)
router.post('/blog-like', auth.isAuthenticated(), controller.blogLike);
router.post('/blog-comment', auth.isAuthenticated(), controller.blogComment);
router.post('/blog-post', auth.isAuthenticated(), controller.blogPost);
router.get('/verification/:id', auth.hasRole(roles['ADMIN']), controller.verification);

module.exports = router;