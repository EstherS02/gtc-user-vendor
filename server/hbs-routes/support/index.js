'use strict';

var express = require('express');
var router = express.Router();
var roles = require('../../config/roles');
var auth = require('../../auth/auth.service');
var ticketCtrl = require('./ticket/ticket.controller');
var faqCtrl = require('./faq/faq.controller');

router.get('/ticket', auth.hasRole(roles['USER']), ticketCtrl.viewTicket);
router.get('/faq',auth.hasRole(roles['USER']), faqCtrl.faq )
router.get('/ticket/create-Ticket', auth.hasRole(roles['USER']), ticketCtrl.createTicket);
router.get('/ticket/update-Ticket/:id', auth.hasRole(roles['USER']), ticketCtrl.updateTicket);

module.exports = router;