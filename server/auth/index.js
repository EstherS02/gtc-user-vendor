'use strict';

import express from 'express';
import passport from 'passport';
import config from '../config/environment';

import oauth from './oauth2';

module.exports = oauth.token;