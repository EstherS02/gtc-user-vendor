'use strict';

var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');
var controller = require('./ticket-thread.controller');

router.post('/:ticket_id', auth.isAuthenticatedUser(), controller.createTicketThread);

module.exports = router;