'use strict';

var async = require('async');

export function vendorLanding(req, res) {
    var LoggedInUser = {};
    if (req.user)
        LoggedInUser = req.user;

    async.series({
    }, function (err, results) {
        if (!err) {
            res.render('vendor-landing', {
                title: "Global Trade Connect",
                LoggedInUser: LoggedInUser,
            });
        } else {
            res.render('vendor-landing', err);
        }
    })
}