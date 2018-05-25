'use strict';

const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');

const service = require('../../api/service');

export function index(req, res) {
	var queryObj = {};
	var currentPage;
	var limit = 5;
	var endPointName = "MarketplaceProduct";
	var offset, limit, field, order;

	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	currentPage = req.query.page ? req.query.page : 1;
	delete req.query.page;

	this.offset = (this.page - 1) * this.limit;

	queryObj['status'] = {
		'$eq': status["ACTIVE"]
	}

	console.log('queryObj', queryObj, currentPage);

	service.findRows(endPointName, queryObj, offset, limit, field, order)
		.then(function(results) {
			res.render('search', {
				title: "Global Trade Connect",
				productResults: results.rows,
				currentPage: currentPage,
				pageCount: results.count,
				size: 5
			});
		})
		.catch(function(error) {
			console.log('Error:::', error);
			res.render('services', error);
		});
}