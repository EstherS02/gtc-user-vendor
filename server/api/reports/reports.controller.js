'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const sequelize = require('sequelize');
const service = require('../service');
const orderItemStatus = require('../../config/order-item-new-status');
const statusCode = require('../../config/status');
const vendorPlan = require('../../config/gtc-plan');
const carrierCode = require('../../config/carriers');
const orderStaus = require('../../config/order_status');
const ReportService = require('../../utilities/reports');
const reportsService = require('../../api/reports/reports.service');
var moment = require('moment');
var async = require('async');
const roles = require('../../config/roles');
const orderItemStatusCode = require('../../config/order-item-new-status');

export function generateReports(req, res) {
	var result = {};
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		result.top_products = results;
		return result;
	}).then(function() {
		return ReportService.topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.top_marketplaces = results;
			return result;
		});
	}).then(function() {
		return ReportService.topPerformingCategories(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.top_categories = results;
			return result;
		});
	}).then(function() {
		return ReportService.revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.revenue_changes = results;
			return result;
		});
	}).then(function() {
		return ReportService.revenueChangesCounts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
			result.revenue_counts = results;
			return res.status(200).send(result);
		});
	}).catch((err) => {
		console.log('generate reports err', err);
		return res.status(500).send(err);
	});
}

export function topSellingCities(req, res) {
	var productQueryObj = {}, result = {}, queryObj = {};
	var Limit = 5;
	var createdBetween = [];

	if (req.query.limit)
		Limit = parseInt(req.query.limit);

	if (req.user.role == 2)
		productQueryObj.vendor_id = req.user.Vendor.id;

	createdBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().subtract(1, 'days').format("YYYY/MM/DD"));

	queryObj['$or'] = [{
		order_item_status: orderItemStatus['ORDER_INITIATED']
	}, {
		order_item_status: orderItemStatus['CONFIRMED']
	}, {
		order_item_status: orderItemStatus['SHIPPED']
	}, {
		order_item_status: orderItemStatus['DELIVERED']
	}, {
		order_item_status: orderItemStatus['COMPLETED']
	}
	];

	queryObj['created_on'] = {
		$between: createdBetween
	};

	model['OrderItem'].findAll({
		raw: true,
		include: [{
			model: model['Product'],
			where: productQueryObj,
			attributes: ['city']
		}],
		where: queryObj,
		attributes: [[sequelize.fn('count', sequelize.col('quantity')), 'sales'],
		[sequelize.fn('sum', sequelize.col('final_price')), 'total_sales'],
		[sequelize.literal('(SUM(gtc_fees) + SUM(plan_fees))'), 'gtc_fees']
		],
		group: ['Product.city'],
		order: [
			[sequelize.fn('sum', sequelize.col('quantity')), 'DESC']
		],
		limit: Limit

	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(200).send(error);
	});
}

export function topSellingCountries(req, res) {

	var productQueryObj = {}, queryObj = {}, result = {};
	var Limit = 5;
	var createdBetween = [];

	if (req.query.limit)
		Limit = parseInt(req.query.limit);

	if (req.user.role == 2)
		productQueryObj.vendor_id = req.user.Vendor.id;

	createdBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().subtract(1, 'days').format("YYYY/MM/DD"));

	queryObj['$or'] = [{
		order_item_status: orderItemStatus['ORDER_INITIATED']
	}, {
		order_item_status: orderItemStatus['CONFIRMED']
	}, {
		order_item_status: orderItemStatus['SHIPPED']
	}, {
		order_item_status: orderItemStatus['DELIVERED']
	}, {
		order_item_status: orderItemStatus['COMPLETED']
	}
	];

	queryObj['created_on'] = {
		$between: createdBetween
	};

	model['OrderItem'].findAll({
		raw: true,
		include: [{
			model: model['Product'],
			where: productQueryObj,
			attributes: ['product_location'],
			include: [{
				model: model['Country'],
				attributes: ['name'],
			}]
		}],
		where: queryObj,
		attributes: [[sequelize.fn('count', sequelize.col('quantity')), 'sales'],
		[sequelize.fn('sum', sequelize.col('final_price')), 'total_sales'],
		[sequelize.literal('(SUM(gtc_fees) + SUM(plan_fees))'), 'gtc_fees']
		],
		group: ['Product.product_location'],
		order: [
			[sequelize.fn('sum', sequelize.col('quantity')), 'DESC']
		],
		limit: Limit
	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];

		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(200).send(error);
	});
}

export function topActiveBuyers(req, res) {
	var queryObj = {}, result = {};

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;

	model['Order'].findAll({
		raw: true,
		where: {},
		order: [
			['created_on', 'DESC']
		],
		group: 'user_id',
		include: [{
			model: model['User'],
			where: {},
			attributes: ['first_name', 'last_name', 'user_pic_url']
		}],
		/*include: [{
			model: model['User'],
			where: {},
			attributes: ['first_name','last_name', 'user_pic_url']			
		},{
			model: model["Product"],
			where: queryObj,
			attributes:[]
		}],*/
		attributes: ['id', 'user_id', 'created_on'],
		limit: 5
	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(200).send(error);
	});
}

/*export function latestTickets(req, res) {
	var queryObj = {};
	var result = {};
	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	model['TicketThread'].findAll({
		raw: true,
		where: {},
		order: [
			['created_on', 'DESC']
		],
		group: 'user_id',
		include: [{
			model: model['User'],
			where: {},
			attributes: ['first_name', 'last_name', 'user_pic_url']
		}],
		attributes: ['id', 'ticket_id', 'user_id', 'message', 'status', 'created_on'],
		limit: 5
	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(200).send(error);
	});
}*/

export function latestTickets(req,res){
	var queryObj = {}, result = {};

	queryObj['status'] = {
		'$ne': statusCode["DELETED"]
	}

	if (req.user.role === roles['VENDOR']){
		queryObj['user_id'] = req.user.id;
	}
	model['Ticket'].findAll({
		raw:true,
		where: queryObj,
		order: [
			['created_on', 'DESC']
		],
		include: [{
			model: model['User'],
			where: {},
			attributes: ['first_name', 'last_name', 'user_pic_url']
		}],
		limit: 5,
		offset:0
	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(200).send(error);
	});
}

/*export function latestRefunds(req, res) {
	var queryObj = {};
	var vendorQuery = {};
	var result = {};

	if (req.user.role == 2)
		vendorQuery.vendor_id = req.user.Vendor.id;

	queryObj['$or'] = [{
		order_item_status: orderItemStatus['REQUEST_FOR_RETURN']
	}, {
		order_item_status: orderItemStatus['APPROVED_REQUEST_FOR_RETURN']
	}, {
		order_item_status: orderItemStatus['RETURN_RECIVED']
	}, {
		order_item_status: orderItemStatus['REFUND']
	}],

	model['User'].findAll({
		attributes: ['id', 'first_name', 'last_name', 'status'],
		limit: 5,
		include: [{
			model: model['Order'],
			attributes: ['id'],
			include: [{
				model: model['OrderItem'],
				attributes: ['id', 'order_item_status'],
				where: queryObj,
				include: [{
					model: model['Product'],
					where: vendorQuery,
					attributes: []
				}]
			}]
		}]
	}).then(function(results) {
		if (results.length > 0)
			result = results;
		else
			result = [];
		return res.status(200).send(result);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(500).send(error);
	});
}*/

export function latestRefunds(req,res){
	var offset, limit, field, order;
	var queryObj = {}, vendorQuery = {};
	var includeArr = [];
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
    delete req.query.offset;
    limit = req.query.limit ? parseInt(req.query.limit) : 5;
    delete req.query.limit;
    field = req.query.field ? req.query.field : "created_on";
    delete req.query.field;
    order = req.query.order ? req.query.order : "desc";
	delete req.query.order;

	if (req.user.role === roles['VENDOR']){
		vendorQuery.vendor_id = req.user.Vendor.id;
	}

	includeArr = [
		{ 
			model:model['Product'],
			attributes:['id', 'product_name', 'vendor_id'],
			where: vendorQuery,
			include: [
				{
					model: model['Vendor'],
					attributes: ['id', 'vendor_name']
				}
			]
		},
		{ 
			model:model['Order'],
			include: [
				{ 
					model: model['User'],
					attributes:['id', 'first_name', 'last_name', 'user_pic_url']
				}
			], 
			attributes:['id', 'user_id']
		}
	]

	queryObj['$or'] = [{
		order_item_status: orderItemStatusCode['REQUEST_FOR_RETURN']
	}, {
		order_item_status: orderItemStatusCode['APPROVED_REQUEST_FOR_RETURN']
	},{
		order_item_status: orderItemStatusCode['RETURN_RECIVED']
	},{
		order_item_status: orderItemStatusCode['REFUND']
	}];	
	
	service.findRows('OrderItem', queryObj, offset, limit, field, order, includeArr)
	.then(function(rows){
		return res.status(200).send(rows);
	}).catch(function(error){
		console.log("Error:::", error);
		return res.status(500).send({
			"message": "error",
			"errorDescription": error
		});
	})
}

export function topProducts(req, res){
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];

	if (req.user.role == 1) {
		orderItemQueryObj.limit = parseInt(req.query.limit);
		orderItemQueryObj.offset = parseInt(req.query.offset);
	}

	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('topProducts err', err);
		return res.status(500).send(err);
	});
}

export function topMarketPlace(req, res) {

	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];

	if (req.user.role == 1) {
		orderItemQueryObj.limit = parseInt(req.query.limit);
		orderItemQueryObj.offset = parseInt(req.query.offset);
	}

	orderItemStatus['$or'] = [{
		order_item_status: orderItemStatus['ORDER_INITIATED']
	}, {
		order_item_status: orderItemStatus['CONFIRMED']
	}, {
		order_item_status: orderItemStatus['SHIPPED']
	}, {
		order_item_status: orderItemStatus['DELIVERED']
	}, {
		order_item_status: orderItemStatus['COMPLETED']
	}];

	if (req.user.role == 2) {
		orderItemQueryObj.vendor_id = req.user.Vendor.id;

		if (req.query.lhs_from && req.query.lhs_to) {
			lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
		} else {
			lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
		if (req.query.rhs_from && req.query.rhs_to) {
			rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
		} else {
			rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
	}

	if (req.user.role != 2) {
		if (req.query.lhs_from && req.query.lhs_to) {
			lhsBetween.push(moment(parseInt(req.query.lhs_from)).format("YYYY/MM/DD"), moment(parseInt(req.query.lhs_to)).format("YYYY/MM/DD"))
		} else {
			lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
		if (req.query.rhs_from && req.query.rhs_to) {
			rhsBetween.push(moment(parseInt(req.query.rhs_from)).format("YYYY/MM/DD"), moment(parseInt(req.query.rhs_to)).format("YYYY/MM/DD"));
		} else {
			rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
	}

	ReportService.topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('topMarketPlace err', err);
		return res.status(500).send(err);
	});
}

export function topBuyers(req, res) {

	var result = {}, queryObj = {}, productQueryObj = {};
	var createdBetween = [];
	var Limit = 5, Offset = 0;

	if (req.query.limit)
		Limit = req.query.limit;

	if (req.query.offset)
		Offset = req.query.offset

	if (req.user.role == 2)
		productQueryObj.vendor_id = req.user.Vendor.id;

	delete req.query.limit;
	delete req.query.offset;

	createdBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().subtract(1, 'days').format("YYYY/MM/DD"));

	queryObj['$or'] = [{
		order_item_status: orderItemStatus['ORDER_INITIATED']
	}, {
		order_item_status: orderItemStatus['CONFIRMED']
	}, {
		order_item_status: orderItemStatus['SHIPPED']
	}, {
		order_item_status: orderItemStatus['DELIVERED']
	}, {
		order_item_status: orderItemStatus['COMPLETED']
	}
	];

	queryObj['created_on'] = {
		$between: createdBetween
	};

	model['Order'].findAll({
		raw: true,
		include: [{
			model: model['OrderItem'],
			where: queryObj,
			include: [{
				model: model['Product'],
				attributes: [],
				where: productQueryObj
			}],
			attributes: [[sequelize.fn('count', sequelize.col('quantity')), 'sales']],

		}, {
			model: model['User'],
			where: { status: statusCode['ACTIVE'] },
			attributes: ['id', 'first_name', 'user_pic_url']
		}],
		attributes: [],
		group: ['user_id'],

		order: [
			[sequelize.fn('sum', sequelize.col('OrderItems.quantity')), 'DESC']
		],
	}).then(function(results) {
		if (results.length > 0) {
			results = results.slice(Offset, Offset + Limit);
		}
		return res.status(200).send(results);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(500).send(error)
	});
}

export function topVendors(req, res) {

	var result = {}, queryObj = {};
	var createdBetween = [];
	var Limit = 5, Offset = 0;
	if (req.query.limit)
		Limit = req.query.limit;
	if (req.query.offset)
		Offset = req.query.offset
	delete req.query.limit;
	delete req.query.offset;

	createdBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().subtract(1, 'days').format("YYYY/MM/DD"));

	queryObj['$or'] = [{
		order_item_status: orderItemStatus['ORDER_INITIATED']
	}, {
		order_item_status: orderItemStatus['CONFIRMED']
	}, {
		order_item_status: orderItemStatus['SHIPPED']
	}, {
		order_item_status: orderItemStatus['DELIVERED']
	}, {
		order_item_status: orderItemStatus['COMPLETED']
	}
	];

	queryObj['created_on'] = {
		$between: createdBetween
	};

	model['OrderItem'].findAll({
		raw: true,
		where: queryObj,
		include: [{
			model: model['Product'],
			attributes: [],
			include: [{
				model: model['Vendor'],
				attributes: ['id', 'vendor_name', 'vendor_profile_pic_url']
			}]
		}],
		attributes: [[sequelize.fn('count', sequelize.col('quantity')), 'sales']],
		group: ['Product.vendor_id'],
		order: [
			[sequelize.fn('sum', sequelize.col('quantity')), 'DESC']
		],
		offset: 0,
		limit: 5

	}).then(function(results) {
		return res.status(200).send(results);
	}).catch(function(error) {
		console.log('Error:::', error);
		return res.status(500).send(error)
	});
}

export function topCategories(req, res) {
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];

	if (req.user.role == 1) {
		orderItemQueryObj.limit = parseInt(req.query.limit);
		orderItemQueryObj.offset = parseInt(req.query.offset);
	}
	orderItemStatus['$or'] = [{
		order_item_status: orderItemStatus['ORDER_INITIATED']
	}, {
		order_item_status: orderItemStatus['CONFIRMED']
	}, {
		order_item_status: orderItemStatus['SHIPPED']
	}, {
		order_item_status: orderItemStatus['DELIVERED']
	}, {
		order_item_status: orderItemStatus['COMPLETED']
	}];
	if (req.user.role == 2) {
		orderItemQueryObj.vendor_id = req.user.Vendor.id;

		if (req.query.lhs_from && req.query.lhs_to) {
			lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
		} else {
			lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
		if (req.query.rhs_from && req.query.rhs_to) {
			rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
		} else {
			rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
	}

	if (req.user.role != 2) {
		if (req.query.lhs_from && req.query.lhs_to) {
			lhsBetween.push(moment(parseInt(req.query.lhs_from)).format("YYYY/MM/DD"), moment(parseInt(req.query.lhs_to)).format("YYYY/MM/DD"))
		} else {
			lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
		if (req.query.rhs_from && req.query.rhs_to) {
			rhsBetween.push(moment(parseInt(req.query.rhs_from)).format("YYYY/MM/DD"), moment(parseInt(req.query.rhs_to)).format("YYYY/MM/DD"));
		} else {
			rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
	}

	ReportService.topPerformingCategories(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('topCategories err', err);
		return res.status(500).send(err);
	});
}

export function recentRevenueChanges(req, res) {
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];

	if (req.user.role == 2) {
		orderItemQueryObj.vendor_id = req.user.Vendor.id;

		if (req.query.lhs_from && req.query.lhs_to) {
			lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
		} else {
			lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
		if (req.query.rhs_from && req.query.rhs_to) {
			rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
		} else {
			rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
	}

	if (req.user.role != 2) {
		if (req.query.lhs_from && req.query.lhs_to) {
			lhsBetween.push(moment(parseInt(req.query.lhs_from)).format("YYYY/MM/DD"), moment(parseInt(req.query.lhs_to)).format("YYYY/MM/DD"))
		} else {
			lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
		if (req.query.rhs_from && req.query.rhs_to) {
			rhsBetween.push(moment(parseInt(req.query.rhs_from)).format("YYYY/MM/DD"), moment(parseInt(req.query.rhs_to)).format("YYYY/MM/DD"));
		} else {
			rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
		}
	}
	ReportService.revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		return res.status(500).send(err);
	});
}

export function revenueChangesCount(req, res) {
	var orderItemQueryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	ReportService.revenueChangesCounts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('recentRevenueChanges err', err);
		return res.status(500).send(err);
	});
}

export function comparePerformance(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.performanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {

		return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}

export function vendorPerformance(req, res) {
	var queryObj = {};
	var lhsBetween = [], rhsBetween = [];
	var limit, offset, compare;

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;

	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}

	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.vendorPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('vendorPerformance err', err);
		return res.status(500).send(err);
	});
}

export function productPerformanceChanges(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.productPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}

export function compareCategoryPerformance(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.categoryPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}

export function compareMarketPlacePerformance(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.marketplacePerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {

		return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}

export function compareCityPerformance(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.cityPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}

export function compareCountriesPerformance(req, res) {
	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;
	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.countryPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {

		return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}

export function compareUserPerformance(req, res) {

	var queryObj = {};
	var lhsBetween = [];
	var rhsBetween = [];
	var limit, offset, compare;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;

	if (req.user.role == 1) {
		if (req.query.compare) {
			req.query.lhs_from = new Date(parseInt(req.query.lhs_from));
			req.query.lhs_to = new Date(parseInt(req.query.lhs_to));
			req.query.rhs_from = new Date(parseInt(req.query.rhs_from));
			req.query.rhs_to = new Date(parseInt(req.query.rhs_to));
		}
	}

	if (req.user.role == 2)
		queryObj.vendor_id = req.user.Vendor.id;
	else
		queryObj.vendor_id = null;

	if (req.query.compare) {
		queryObj.compare = req.query.compare ? req.query.compare : 'false';
	}

	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
	}

	ReportService.userPerformanceChanges(queryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		return res.status(200).send(results);
	}).catch((err) => {
		console.log('comparePerformance err', err);
		return res.status(500).send(err);
	});
}

export function vendorTrail(req, res) {
	var queryObj = {};
	var planQueryObj = {};
	var offset = 0;
	var limit = 5;
	var order = 'asc';
	var field = 'created_on';
	queryObj.status = statusCode['ACTIVE'];
	planQueryObj.plan_id = vendorPlan['STARTER_SELLER'];
	planQueryObj.status = statusCode['ACTIVE'];
	var includeArr = [{
		model: model['VendorPlan'],
		attributes: ['id', 'start_date', 'end_date', 'status'],
		where: planQueryObj
	}];
	try {
		model["Vendor"].findAll({
			include: includeArr,
			where: queryObj,
			attributes: ['id', 'vendor_name', 'vendor_profile_pic_url', 'created_on'],
			offset: offset,
			limit: limit,
			order: [
				[field, order]
			]
		}).then(function(rows) {
			if (rows.length > 0) {
				return res.status(200).send(rows);
			} else {
				return res.status(200).send(rows);
			}
		}).catch(function(error) {
			console.log("error:::::::", error)
			return res.status(500).send(error);
		});
	} catch (error) {
		console.log("Add To Cart Error:::", error);
		return res.status(500).send(error);
	}
}

export function accounting(req, res) {

	var accountingQueryParams = {};
	if (req.query.start_date) {
		accountingQueryParams['start_date'] = new Date(parseInt(req.query.start_date));
		accountingQueryParams['end_date'] = new Date(parseInt(req.query.end_date));
	} else {
		accountingQueryParams['start_date'] = moment().subtract(30, 'days').format('YYYY-MM-DD');
		accountingQueryParams['end_date'] = moment().subtract(1, 'days').format('YYYY-MM-DD');

	}
	reportsService.AccountingReport(0, accountingQueryParams)
		.then((response) => {

			return res.status(200).send(response);
		})
		.catch((error) => {
			console.log(error)
			return res.status(500).send("Internal server error");
		});
}

export function memberShipFees(req, res) {

	var queryObj = {
		plan_id: {
			$ne: vendorPlan['STARTER_SELLER']
		}
	};
	var field, order, offset, limit;

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	order = req.query.order ? req.query.order : "desc";
	field = req.query.field ? req.query.field : "id";

	var includeArr = [
		{
			model: model['Plan']
		}, {
			model: model['Vendor']
		}, {
			model: model['Payment'],
			attributes: ['id', 'amount', 'date', 'created_on'],
			where: {
				id: {
					$ne: null
				},
				status: statusCode['ACTIVE']
			}
		}
	]

	service.findRows('VendorPlan', queryObj, offset, limit, field, order, includeArr)
		.then(function(plans) {
			return res.status(200).send(plans)
		}).catch(function(error) {
			console.log(error)
			return res.status(500).send("Internal server error");
		})
}