'use strict';

var express = require('express');
var router = express.Router();
var roles = require('../../config/roles');
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service');

var ticketCtrl = require('./ticket/ticket.controller');


router.get('/ticket', auth.hasRole(roles['USER']), ticketCtrl.viewTicket);
router.get('/ticket/create-Ticket', auth.hasRole(roles['USER']), ticketCtrl.createTicket);
router.get('/ticket/update-Ticket/:id', auth.hasRole(roles['USER']), ticketCtrl.updateTicket);

module.exports = router;