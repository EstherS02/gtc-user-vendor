'use strict';

const moment = require('moment');
const compose = require('composable-middleware');
const model = require('../sqldb/model-connect');
const config = require('../config/environment');
const service = require('../api/service');
const status = require('../config/status');
const roles = require('../config/roles');

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

                queryObjPlanLimit['plan_id'] = vendorCurrentPlan.plan_id;
                queryObjPlanLimit['status'] = status['ACTIVE'];

                queryObjProduct['vendor_id'] = req.user.Vendor.id;
                queryObjProduct['created_on'] = {
                    '$gte': planStartDate,
                    '$lte': planEndDate
                }
                service.findOneRow(planLimitModelName, queryObjPlanLimit)
                    .then(function(planLimit) {
                        if (planLimit) {
                            const maximumProductLimit = planLimit.maximum_product;
                            service.countRows(productModelName, queryObjProduct)
                                .then(function(existingProductCount) {
                                    if (existingProductCount < maximumProductLimit) {
                                        return next();
                                    } else {
                                        return res.status(403).send("Limit exceeded to add product.");
                                    }
                                }).catch(function(error) {
                                    console.log("Error::::", error);
                                    return next(error);
                                });
                        } else {
                            return res.status(404).send("Plan limit not found.");
                        }
                    }).catch(function(error) {
                        console.log("Error::::", error);
                        return next(error);
                    });
            } else {
                return res.status(403).send("Forbidden");
            }
        });
}

exports.limitExceeds = limitExceeds;