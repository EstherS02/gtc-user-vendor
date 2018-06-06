'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

export function promoteStore(req, res) {
    var LoggedInUser = {};

    if(req.user)
    LoggedInUser = req.user;
    
    let user_id = LoggedInUser.id;

    res.render('promote-store', {
        title: "Global Trade Connect",
        LoggedInUser: LoggedInUser
    });

}