'use strict';

const _ = require('lodash');
const moment = require('moment');
const sequelize = require('sequelize');
const Handlebars = require('handlebars');

const sendEmail = require('./send-email');
const service = require('../api/service');
const config = require('../config/environment');
const status = require('../config/status');
const model = require('../sqldb/model-connect');

module.exports = async function(job, done) {
	const orderID = job.attrs.data.order;
	const orderModelName = "OrdersNew";
	var emailTemplateModel = 'EmailTemplate';
	const orderVendorModelName = "OrderVendor";
	const orderItemModelName = "OrdersItemsNew";

	const includeOrderArray = [{
		model: model['User'],
		attributes: ['id', 'first_name', 'last_name', 'user_contact_email', 'email_verified']
	}, {
		model: model['Address'],
		as: 'shippingAddress1',
		attributes: ['id', 'first_name', 'last_name', 'company_name', 'address_line1', 'address_line2', 'city', 'postal_code'],
		include: [{
			model: model['State'],
			attributes: ['id', 'name']
		}, {
			model: model['Country'],
			attributes: ['id', 'name']
		}]
	}, {
		model: model[orderItemModelName],
		attributes: ['id', 'order_id', 'product_id', 'quantity', 'price'],
		include: [{
			model: model['Product'],
			attributes: ['id', 'product_name'],
			include: [{
				model: model['ProductMedia'],
				where: {
					status: status['ACTIVE'],
					base_image: 1
				},
				attributes: ['id', 'product_id', 'type', 'url', 'base_image'],
				required: false
			}]
		}]
	}];

	try {
		const userOrderEmailTemplate = await service.findOneRow("EmailTemplate", {
			name: "GTC-ORDER-DETAIL-NEW"
		});

		const orderVendorEmailTemplate = await service.findOneRow("EmailTemplate", {
			name: "GTC-VENDOR-ORDER-DETAIL"
		});

		const userOrderResponse = await service.findOneRow(orderModelName, {
			id: orderID
		}, includeOrderArray);

		const orderVendorResponse = await model[orderVendorModelName].findAll({
			where: {
				order_id: orderID,
				vendor_id: {
					$col: 'OrdersNew->OrdersItemsNews->Product.vendor_id'
				}
			},
			attributes: ['id', 'order_id', 'vendor_id', 'status'],
			include: [{
				model: model['Vendor'],
				attributes: ['id', 'vendor_name', 'contact_email']
			}, {
				model: model['OrdersNew'],
				attributes: ['id', 'ordered_date'],
				include: [{
					model: model['Address'],
					as: 'shippingAddress1',
					attributes: ['id', 'first_name', 'last_name', 'company_name', 'address_line1', 'address_line2', 'city', 'postal_code'],
					include: [{
						model: model['State'],
						attributes: ['id', 'name']
					}, {
						model: model['Country'],
						attributes: ['id', 'name']
					}]
				}, {
					model: model['OrdersItemsNew'],
					attributes: ['id', 'order_id', 'product_id', 'quantity', 'price', 'shipping_cost', 'gtc_fees', 'plan_fees', 'final_price'],
					include: [{
						model: model['Product'],
						attributes: ['id', 'product_name', 'vendor_id'],
						include: [{
							model: model['ProductMedia'],
							where: {
								status: status['ACTIVE'],
								base_image: 1
							},
							attributes: ['id', 'product_id', 'type', 'url', 'base_image'],
							required: false
						}]
					}]
				}]
			}]
		});
		var orderVendors = await JSON.parse(JSON.stringify(orderVendorResponse));

		var userOrderSubject = userOrderEmailTemplate.subject;
		var userOrderTemplate = Handlebars.compile(userOrderEmailTemplate.body);
		userOrderResponse.ordered_date = moment(userOrderResponse.ordered_date).format('MMM D, Y');
		var userOrderResult = userOrderTemplate(userOrderResponse);


		await Promise.all(orderVendors.map(async (orderVendor, i) => {
			orderVendors[i].OrdersNew.total_price = await _.sumBy(orderVendor.OrdersNew.OrdersItemsNews, function(o) {
				return parseFloat(o.price);
			});
			var orderVendorSubject = orderVendorEmailTemplate.subject;
			var orderVendorTemplate = Handlebars.compile(orderVendorEmailTemplate.body);
			orderVendor.OrdersNew.ordered_date = moment(orderVendor.OrdersNew.ordered_date).format('MMM D, Y');
			var orderVendorResult = orderVendorTemplate(orderVendor.OrdersNew);
			if (orderVendor.Vendor.contact_email) {
				await sendEmail({
					to: orderVendor.Vendor.contact_email,
					subject: orderVendorSubject,
					html: orderVendorResult
				});
			}
		}));

		if (userOrderResponse.User.email_verified && userOrderResponse.User.user_contact_email) {
			await sendEmail({
				to: userOrderResponse.User.user_contact_email,
				subject: userOrderSubject,
				html: userOrderResult
			});
		}
		done();
	} catch (error) {
		console.log("indexExample Error:::", error);
		return error;
	}
}