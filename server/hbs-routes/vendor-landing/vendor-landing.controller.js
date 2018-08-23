'use strict';

var async = require('async');
const config = require('../../config/environment');

export function vendorLanding(req, res) {
	var LoggedInUser = {};
	if (req.user)
		LoggedInUser = req.user;

	async.series({}, function(err, results) {
		if (!err) {
			res.render('vendorNav/vendor-landing', {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				AmazonDeveloperID: config.amazonImportConfig.developerId
			});
		} else {
			res.render('vendorNav/vendor-landing', err);
		}
	})
}