'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function socialProfile(req, res) {
    var LoggedInUser = {};
   
    var vendorModel = "Vendor";

    if(req.user)
    LoggedInUser = req.user;
    
    let user_id = LoggedInUser.id;

    async.series({
        vendorInfo: function (callback) {
            var id = LoggedInUser.Vendor.id;
            service.findIdRow(vendorModel,id )
                .then(function (vendorInfo) {

                    return callback(null, vendorInfo);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }
    }, function (err, results) {
        if (!err) {
            res.render('social-profile', {
				title: "Global Trade Connect",
                vendorInfo:results.vendorInfo,
                LoggedInUser: LoggedInUser,
                selectedPage:'social-profile',
                vendorPlan:vendorPlan
			});
        }
        else {
            res.render('social-profile', err);
        }
    });

}