'use strict';

var express = require('express');
var controller = require('./gtc.controller');
var middleware = require('../../middleware/dynamic.js');

var router = express.Router();

router.get('/:entityEndPoint', middleware.validateResource(), controller.index);	
router.get('/:entityEndPoint/:id', middleware.validateResource(), controller.findOne);
router.post('/:entityEndPoint', middleware.validateResource(), 	controller.create);
router.delete('/:entityEndPoint/:id', middleware.validateResource(), controller.destroy);
router.put('/:entityEndPoint/:id', middleware.validateResource(), controller.update);
router.put('/:entityEndPoint/:id/delete', middleware.validateResource(), controller.softDelete);

module.exports = router;
