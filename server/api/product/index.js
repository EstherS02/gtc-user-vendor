'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./product.controller');
//var middleware = require('../../middleware');
var permission = require('../../config/permission');

var router = express.Router();

router.put('/feature-one/:id', controller.featureOne);
router.put('/feature-many', controller.featureMany);
router.post('/add-product', auth.isAuthenticated(), controller.addProduct);
router.post('/edit-product', auth.isAuthenticated(), controller.editProduct);

module.exports = router;