'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./ticket-thread.controller');

router.post('/:ticket_id', auth.isAuthenticated(), controller.createTicketThread);

module.exports = router;