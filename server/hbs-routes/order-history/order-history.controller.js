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

export function orderHistory(req, res) {
    var LoggedInUser = {};
    console.log(req.user.Vendor.id)
    if(req.user)
    LoggedInUser = req.user;
    

    var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	var vendor_id = req.user.Vendor.id;
	var rating_limit = 120;
	var queryObj = {};
	
    let user_id = LoggedInUser.id;
    //pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 5;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;
	// End pagination

    async.series({


    },
	function(err, results) {
			if (!err) {
				res.render('order-history', {
					title: "Global Trade Connect",
					orderHistory: results.wishlist.rows,
					count: results.wishlist.count,
					LoggedInUser: LoggedInUser
				});
			} else {
				res.render('order-history', err);
			}
		});
    // res.render('order-history', {
    //     title: "Global Trade Connect",
    //     LoggedInUser: LoggedInUser
    // });

}