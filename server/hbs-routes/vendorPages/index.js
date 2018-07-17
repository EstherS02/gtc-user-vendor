'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('../../middleware');
var permission = require('../../config/permission');
var auth = require('../../auth/auth.service')
var globalUser = require('../../auth/global-user-obj');

var aboutCtrl = require('./about/about.controller');
var discussionBoardCtrl = require('./discussion-board/discussion-board.controller');
var landingCtrl = require('./landing/landing.controller');
var lifestyleCtrl = require('./lifestyle/lifestyle.controller');
var servicesCtrl = require('./services/services.controller');
var shopCtrl = require('./shop/shop.controller');
var supportCtrl = require('./support/support.controller');
var wholesaleCtrl = require('./wholesale/wholesale.controller');

router.get('/:id',auth.isAuthenticated(), landingCtrl.vendor);
router.get('/about/:id',auth.isAuthenticated(), aboutCtrl.vendorAbout);
router.get('/discussion-board/:id',auth.isAuthenticated(), discussionBoardCtrl.vendorDiscussion);
router.get('/lifestyle/:id',auth.isAuthenticated(), lifestyleCtrl.vendorLifestyle);
router.get('/services/:id',auth.isAuthenticated(), servicesCtrl.vendorServices);
router.get('/shop/:id',auth.isAuthenticated(), shopCtrl.vendorShop);
router.get('/support/:id',auth.isAuthenticated(), supportCtrl.vendorSupport);
router.get('/wholesale/:id',auth.isAuthenticated(), wholesaleCtrl.vendorWholesale);

module.exports = router;

