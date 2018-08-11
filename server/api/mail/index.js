'use strict';

var express = require('express');
var roles = require('../../config/roles');
var auth = require('../../auth/auth.service');
var controller = require('./mail.controller');

var router = express.Router();

router.post('/draf', auth.hasRole(roles['USER']), controller.createDraf);
router.post('/', auth.hasRole(roles['USER']), controller.create);
router.put('/delete/:id', auth.hasRole(roles['USER']), controller.softDelete);
router.delete('/remove/:id', auth.hasRole(roles['USER']), controller.remove);

module.exports = router;