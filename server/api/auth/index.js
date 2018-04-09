'use strict';

import express from 'express';
import controller from './auth.controller';
import config from '../../config/environment';
//import auth from '../../auth/auth.service';
var router = express.Router();

router.post('/login', controller.login);
router.post('/refresh-token', controller.refreshToken);
router.post('/logout', controller.logout);

module.exports = router;