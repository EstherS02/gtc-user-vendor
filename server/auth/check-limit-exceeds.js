'use strict';

const moment = require('moment');
const compose = require('composable-middleware');
const model = require('../sqldb/model-connect');
const config = require('../config/environment');
const service = require('../api/service');
const status = require('../config/status');
const roles = require('../config/roles');
var plan = require('../config/gtc-plan');
var marketplace = require('../config/marketplace');

function limitExceeds() {
	return compose()
		.use(function(req, res, next) {
			if (req.user.role === roles['ADMIN']) {
				return next();
			} else if (req.user.role === roles['VENDOR']) {
				var queryObjProduct = {};
				var queryObjPlanLimit = {};
				var productModelName = "Product";
				var planLimitModelName = "PlanLimit";
				var vendorCurrentPlan = req.user.Vendor.VendorPlans[0];
				var planStartDate = moment(vendorCurrentPlan.start_date, 'YYYY-MM-DD').startOf('day').utc().format("YYYY-MM-DD HH:mm");
				var planEndDate = moment(vendorCurrentPlan.end_date, 'YYYY-MM-DD').endOf('day').utc().format("YYYY-MM-DD HH:mm");

				(async () => {
					try {
						queryObjPlanLimit['plan_id'] = vendorCurrentPlan.plan_id;
						queryObjPlanLimit['status'] = status['ACTIVE'];

						queryObjProduct['vendor_id'] = req.user.Vendor.id;
						queryObjProduct['created_on'] = {
							'$gte': planStartDate,
							'$lte': planEndDate
						}

						const planLimit = await service.findOneRow(planLimitModelName, queryObjPlanLimit);
						if (planLimit.maximum_product == -1) {
							return next();
						} else {
							const existingProductCount = await service.countRows(productModelName, queryObjProduct);
							if (existingProductCount < planLimit.maximum_product) {
								if (vendorCurrentPlan.Plan.id == plan['STARTER_SELLER'] && req.body.marketplace_id == marketplace['LIFESTYLE']) {
									queryObjProduct['marketplace_id'] = marketplace['LIFESTYLE'];
									const existingLifestyleProductCount = await service.countRows(productModelName, queryObjProduct);
									if (existingLifestyleProductCount < planLimit.maximum_subscription) {
										return next();
									} else {
										return res.status(403).send("Limit exceeded to add lifestyle product.");
									}
								} else {
									return next();
								}
							} else {
								return res.status(403).send("Limit exceeded to add product.");
							}
						}
					} catch (error) {
						console.log("limitExceeds Error:::", error);
						return next(error);
					}
				})();
			} else {
				return res.status(403).send("Forbidden");
			}
		});
}

exports.limitExceeds = limitExceeds;