'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./product.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.get('/', controller.index);
router.put('/feature_one/:id', controller.featureOne);
router.put('/feature_many', controller.featureMany);


module.exports = router;