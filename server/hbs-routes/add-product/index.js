'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');


/* Handlebars routes */
var controller = require('./add-product.controller');

router.get('/', controller.AddProduct);


module.exports = router;