'use strict';

const _ = require('lodash');
const moment = require('moment');
const sequelize = require('sequelize');
const service = require('../api/service');
const config = require('../config/environment');
const status = require('../config/status');
const model = require('../sqldb/model-connect');
const oredrItemStatus = require('../config/order-item-new-status');
const Handlebars = require('handlebars');
const sendEmail = require('./send-email');

module.exports = async function(job, done) {
	const code = job.attrs.data.code;
	const orderModelName = "Order";
	const productModelName = "Product";
	const orderVendorModelName = "OrderVendor";
	const orderItemModelName = "OrderItem";
	const vendorNotificationSettingsModelName = "VendorNotificationSetting";
	const vendorNotificationModelName = "VendorNotification";
	const notificationSettingModelName = "NotificationSetting";
	const notificationModelName = "Notification";
	const reviewModelName = "Review";
	const discussionBoardPostModelName = "DiscussionBoardPost";
	const discussionBoardPostCommentModelName = "DiscussionBoardPostComment";
	const discussionBoardPostLikeModelName = "DiscussionBoardPostLike";
	const emailTemplateModelName = "EmailTemplate";

	try {
		
		// vendor new order notification
		if (code == config.notification.templates.vendorNewOrder) {
			const orderId = job.attrs.data.order;
			const VendorNotificationResponse = await service.findRow(vendorNotificationModelName, {
				code: code
			});
			if (VendorNotificationResponse) {
				const orderVendorResponse = await model[orderVendorModelName].findAll({
					where: {
						order_id: orderId,
					},
					attributes: ['id', 'order_id', 'vendor_id', 'status'],
					include: [{
						model: model['Vendor'],
						attributes: ['id', 'vendor_name', 'contact_email', 'user_id']
					}]
				});

				var orderVendors = await JSON.parse(JSON.stringify(orderVendorResponse));
				await Promise.all(orderVendorResponse.map(async (orderVendor, i) => {
					const vendorNotificationSettingsRes = await service.findRow(vendorNotificationSettingsModelName, {
						vendor_id: orderVendor.vendor_id,
						vendor_notification_id: VendorNotificationResponse.id
					});
					if (vendorNotificationSettingsRes == null) {
						const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
							code: code
						});
						if (notificationSettingResponse) {

							var bodyParams = {};
							bodyParams.user_id = orderVendor.Vendor.user_id;
							bodyParams.description = notificationSettingResponse.description.replace('%PATH%', '/my-order/order/' + orderVendor.order_id);
							bodyParams.description = bodyParams.description.replace('%VENDOR_NAME%', orderVendor.Vendor.vendor_name);
							bodyParams.description = bodyParams.description.replace('%ORDER_ID%', orderVendor.order_id);
							bodyParams.name = notificationSettingResponse.name;
							bodyParams.code = notificationSettingResponse.code;
							bodyParams.is_read = 0;
							bodyParams.status = 1;
							bodyParams.created_on = new Date();
							bodyParams.created_by = "Administrator";

							const notificationResponse = await service.createRow(notificationModelName, bodyParams);
						}
					}
				}));
			}
		}

		// user new order notification
		if (code == config.notification.templates.orderDetail) {
			const orderId = job.attrs.data.order;
			const orderResponse = await model[orderModelName].findOne({
				where: {
					id: orderId,
				},
				attributes: ['id', 'user_id', 'status'],
				include: [{
					model: model['User'],
					attributes: ['id', 'first_name', 'email']
				}]
			});
			var order = await JSON.parse(JSON.stringify(orderResponse));
			if (order) {
				const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
					code: code
				});
				if (notificationSettingResponse) {
					var bodyParams = {};
					bodyParams.user_id = order.user_id;
					bodyParams.description = notificationSettingResponse.description;
					bodyParams.description = bodyParams.description.replace('%FIRST_NAME%', order.User.first_name);
					bodyParams.description = bodyParams.description.replace('%PATH%', '/order-history/' + order.id);
					bodyParams.description = bodyParams.description.replace('%ORDER_ID%', order.id);
					bodyParams.name = notificationSettingResponse.name;
					bodyParams.code = notificationSettingResponse.code;
					bodyParams.is_read = 0;
					bodyParams.status = 1;
					bodyParams.created_on = new Date();
					bodyParams.created_by = "Administrator";
					const notificationResponse = await service.createRow(notificationModelName, bodyParams);
				}
			}
		}

		// order cancelled notification and email
		if (code == config.notification.templates.orderItemCancelled) {

			const itemId = job.attrs.data.itemId;
			const orderItemResponse = await model[orderItemModelName].findOne({
				where: {
					id: itemId,
				},
				attributes: ['id', 'order_id', 'product_id', 'reason_for_return','quantity', 'reason_for_cancel', 'price', 'status', 'order_item_status', 'last_updated_by'],
				include: [{
					model: model['Order'],
					attributes: ['id', 'ordered_date', 'user_id', 'total_price'],
					include: [{
						model: model['User'],
						attributes: ['id', 'first_name', 'user_contact_email']
					}]
				}, {
					model: model['Product'],
					attributes: ['id', 'vendor_id', 'product_name'],
					include: [{
						model: model['Vendor'],
						attributes: ['id', 'user_id', 'vendor_name'],
						include: [{
							model: model['User'],
							attributes: ['id', 'first_name', 'user_contact_email']
						}]
					}, {
						model: model['ProductMedia'],
						where: {
							status: status['ACTIVE'],
							base_image: 1
						},
						attributes: ['id', 'product_id', 'type', 'url', 'base_image']
					}]
				}]
			});
			var orderItem = await JSON.parse(JSON.stringify(orderItemResponse));
			const VendorNotificationResponse = await service.findRow(vendorNotificationModelName, {
				code: code
			});
			if (orderItem && VendorNotificationResponse) {
				if (orderItem.order_item_status == oredrItemStatus['CANCELED']) {

					const vendorNotificationSettingsRes = await service.findRow(vendorNotificationSettingsModelName, {
						vendor_id: orderItem.Product.vendor_id,
						vendor_notification_id: VendorNotificationResponse.id
					});
					if (vendorNotificationSettingsRes == null) {
						const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
							code: code
						});
						if (notificationSettingResponse) {
							var bodyParams = {};
							bodyParams.user_id = orderItem.Product.Vendor.user_id;
							bodyParams.description = notificationSettingResponse.description;
							bodyParams.description = bodyParams.description.replace('%VENDOR_NAME%', orderItem.Product.Vendor.vendor_name);
							bodyParams.description = bodyParams.description.replace('%ORDER_ID%', orderItem.order_id);
							bodyParams.description = bodyParams.description.replace('%BUYER_NAME%', orderItem.last_updated_by);
							bodyParams.description = bodyParams.description.replace('%PATH%', '/my-order/order/' + orderItem.order_id);
							bodyParams.description = bodyParams.description.replace('%REASON_FOR_CANCELATION%', orderItem.reason_for_cancel);
							bodyParams.description = bodyParams.description.replace('%PRODUCT_NAME%', orderItem.Product.product_name);
							bodyParams.name = notificationSettingResponse.name;
							bodyParams.code = notificationSettingResponse.code;
							bodyParams.is_read = 0;
							bodyParams.status = 1;
							bodyParams.created_on = new Date();
							bodyParams.created_by = "Administrator";
							const notificationResponse = await service.createRow(notificationModelName, bodyParams);
						}
					}
				} else if (orderItem.order_item_status == oredrItemStatus['VENDOR_CANCELED']) {
					const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
						code: code
					});

					const orderItemEmailTemplate = await service.findOneRow(emailTemplateModelName, {
						name: "ITEM-CANCEL-USER-MAIL"
					});

					if(orderItemEmailTemplate) {
						let orderStatusSubject = orderItemEmailTemplate.subject;
						let orderStatusBody = orderItemEmailTemplate.body;
						orderItem.Order.ordered_date = moment(orderItem.Order.ordered_date).format('MMM D, Y');
						orderStatusBody = orderStatusBody.replace('%status%', 'canceled by vendor');
						let template = Handlebars.compile(orderStatusBody);
						let result = template(orderItem);
						if (orderItem.Order.User.user_contact_email) {
							await sendEmail({
								to: orderItem.Order.User.user_contact_email,
								subject: orderStatusSubject,
								html: result
							});
						}
					}

					if (notificationSettingResponse) {
						var bodyParams = {};
						bodyParams.user_id = orderItem.Order.user_id;
						bodyParams.description = notificationSettingResponse.description;
						bodyParams.description = bodyParams.description.replace('%VendorFirstname%', orderItem.Order.User.first_name);
						bodyParams.description = bodyParams.description.replace('%orderId%', orderItem.order_id);
						bodyParams.description = bodyParams.description.replace('%Cancend_by%', orderItem.last_updated_by);
						bodyParams.description = bodyParams.description.replace('%#path%', '/order-history/' + orderItem.order_id);
						bodyParams.name = notificationSettingResponse.name;
						bodyParams.code = notificationSettingResponse.code;
						bodyParams.is_read = 0;
						bodyParams.status = 1;
						bodyParams.created_on = new Date();
						bodyParams.created_by = "Administrator";
						const notificationResponse = await service.createRow(notificationModelName, bodyParams);
					}
				} else if (orderItem.order_item_status == oredrItemStatus['AUTO_CANCELED']) {

					const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
						code: code
					});

					const orderItemEmailTemplate = await service.findOneRow(emailTemplateModelName, {
						name: "ITEM-CANCEL-USER-MAIL"
					});

					if(orderItemEmailTemplate) {
						let orderStatusSubject = orderItemEmailTemplate.subject;
						let orderStatusBody = orderItemEmailTemplate.body;
						orderItem.Order.ordered_date = moment(orderItem.Order.ordered_date).format('MMM D, Y');
						orderStatusBody = orderStatusBody.replace('%status%', 'canceled by admin');
						let template = Handlebars.compile(orderStatusBody);
						let result = template(orderItem);
						if (orderItem.Order.User.user_contact_email) {
							await sendEmail({
								to: orderItem.Order.User.user_contact_email,
								subject: orderStatusSubject,
								html: result
							});
						}
					}

					if (notificationSettingResponse) {
						var bodyParams = {};
						bodyParams.user_id = orderItem.Order.user_id;
						bodyParams.description = notificationSettingResponse.description;
						bodyParams.description = bodyParams.description.replace('%VendorFirstname%', orderItem.Order.User.first_name);
						bodyParams.description = bodyParams.description.replace('%orderId%', orderItem.order_id);
						bodyParams.description = bodyParams.description.replace('%Cancend_by%', orderItem.last_updated_by);
						bodyParams.description = bodyParams.description.replace('%#path%', '/order-history/' + orderItem.order_id);
						bodyParams.name = notificationSettingResponse.name;
						bodyParams.code = notificationSettingResponse.code;
						bodyParams.is_read = 0;
						bodyParams.status = 1;
						bodyParams.created_on = new Date();
						bodyParams.created_by = "Administrator";
						const notificationResponse = await service.createRow(notificationModelName, bodyParams);
					}

					const vendorNotificationSettingsRes = await service.findRow(vendorNotificationSettingsModelName, {
						vendor_id: orderItem.Product.vendor_id,
						vendor_notification_id: VendorNotificationResponse.id
					});
					if (vendorNotificationSettingsRes == null) {
						if (notificationSettingResponse) {
							var bodyParams = {};
							bodyParams.user_id = orderItem.Product.Vendor.user_id;
							bodyParams.description = notificationSettingResponse.description;
							bodyParams.description = bodyParams.description.replace('%VendorFirstname%', orderItem.Product.Vendor.User.first_name);
							bodyParams.description = bodyParams.description.replace('%orderId%', orderItem.order_id);
							bodyParams.description = bodyParams.description.replace('%Cancend_by%', orderItem.last_updated_by);
							bodyParams.description = bodyParams.description.replace('%#path%', '/my-order/order/' + orderItem.order_id);
							bodyParams.name = notificationSettingResponse.name;
							bodyParams.code = notificationSettingResponse.code;
							bodyParams.is_read = 0;
							bodyParams.status = 1;
							bodyParams.created_on = new Date();
							bodyParams.created_by = "Administrator";
							const notificationResponse = await service.createRow(notificationModelName, bodyParams);
						}

						const orderItemEmailTemplateAdmin = await service.findOneRow(emailTemplateModelName, {
							name: "ITEM-CANCEL-BY-VENDOR-MAIL"
						});

						if(orderItemEmailTemplateAdmin) {
							let orderStatusSubject = orderItemEmailTemplateAdmin.subject;
							let orderStatusBody = orderItemEmailTemplateAdmin.body;
							orderItem.Order.ordered_date = moment(orderItem.Order.ordered_date).format('MMM D, Y');
							orderStatusBody = orderStatusBody.replace('%status%', 'canceled by admin');
							let template = Handlebars.compile(orderStatusBody);
							let result = template(orderItem);
							if (orderItem.Product.Vendor.User.user_contact_email) {
								await sendEmail({
									to: orderItem.Product.Vendor.User.user_contact_email,
									subject: orderStatusSubject,
									html: result
								});
							}
						}
					}
				}
			}
		}

		// order status change notification and email
		if (code == config.notification.templates.orderStatus) {
			const itemId = job.attrs.data.itemId;
			const orderItemResponse = await model[orderItemModelName].findOne({
				where: {
					id: itemId,
				},
				attributes: ['id', 'order_id', 'product_id', 'quantity', 'price', 'status', 'order_item_status', 'last_updated_by'],
				include: [{
					model: model['Order'],
					attributes: ['id', 'ordered_date', 'user_id', 'total_price'],
					include: [{
						model: model['User'],
						attributes: ['id', 'first_name', 'user_contact_email']
					}]
				}, {
					model: model['Product'],
					attributes: ['id', 'product_name'],
					include: [{
						model: model['ProductMedia'],
						where: {
							status: status['ACTIVE'],
							base_image: 1
						},
						attributes: ['id', 'product_id', 'type', 'url', 'base_image']
					}]
				}]
			});
			var orderItem = await JSON.parse(JSON.stringify(orderItemResponse));
			if (orderItem) {
				const orderItemStatusEmailTemplate = await service.findOneRow(emailTemplateModelName, {
					name: "ORDER-ITEM-STATUS"
				});
				if (orderItemStatusEmailTemplate) {
					let orderStatusSubject = orderItemStatusEmailTemplate.subject;
					let orderStatusBody = orderItemStatusEmailTemplate.body;
					orderItem.Order.ordered_date = moment(orderItem.Order.ordered_date).format('MMM D, Y');
					if (orderItem.order_item_status == oredrItemStatus['CONFIRMED'])
						orderStatusBody = orderStatusBody.replace('%status%', 'confirm by vendor');
					else if (orderItem.order_item_status == oredrItemStatus['SHIPPED'])
						orderStatusBody = orderStatusBody.replace('%status%', 'dispatched by vendor');
					else if (orderItem.order_item_status == oredrItemStatus['DELIVERED'])
						orderStatusBody = orderStatusBody.replace('%status%', 'delivered');
					else if (orderItem.order_item_status == oredrItemStatus['COMPLETED'])
						orderStatusBody = orderStatusBody.replace('%status%', 'completed');
					let template = Handlebars.compile(orderStatusBody);
					let result = template(orderItem);
					if (orderItem.Order.User.user_contact_email) {
						await sendEmail({
							to: orderItem.Order.User.user_contact_email,
							subject: orderStatusSubject,
							html: result
						});
					}
				} 

				const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
					code: code
				});
				if (notificationSettingResponse) {
					var bodyParams = {};
					bodyParams.user_id = orderItem.Order.user_id;
					bodyParams.description = notificationSettingResponse.description;
					bodyParams.description = bodyParams.description.replace('%ORDER_ID%', orderItem.order_id);
					if (orderItem.order_item_status == oredrItemStatus['CONFIRMED'])
						bodyParams.description = bodyParams.description.replace('%ORDER_STATUS%', 'Confirm by vendor');
					else if (orderItem.order_item_status == oredrItemStatus['SHIPPED'])
						bodyParams.description = bodyParams.description.replace('%ORDER_STATUS%', 'Dispatched by vendor');
					else if (orderItem.order_item_status == oredrItemStatus['DELIVERED'])
						bodyParams.description = bodyParams.description.replace('%ORDER_STATUS%', 'Delivered');
					else if (orderItem.order_item_status == oredrItemStatus['COMPLETED'])
						bodyParams.description = bodyParams.description.replace('%ORDER_STATUS%', 'Completed');
					bodyParams.description = bodyParams.description.replace('%#Order%', '/order-history/' + orderItem.order_id + '/track-order-item/' + orderItem.id);
					bodyParams.name = notificationSettingResponse.name;
					bodyParams.code = notificationSettingResponse.code;
					bodyParams.is_read = 0;
					bodyParams.status = 1;
					bodyParams.created_on = new Date();
					bodyParams.created_by = "Administrator";
					const notificationResponse = await service.createRow(notificationModelName, bodyParams);
				}
			}
		}

		//order item return notification and email
		if (code == config.notification.templates.refundRequest || code == config.notification.templates.refundProcessing
			|| code == config.notification.templates.refundSuccessful) {
			let emailName;
			const itemId = job.attrs.data.itemId;
			if (code == config.notification.templates.refundRequest)
				emailName = 'USER-RETURN-REQUEST';
			else if (code == config.notification.templates.refundProcessing)
				emailName = 'VENDOR-TO-REFUND'
			else if (code == code == config.notification.templates.refundSuccessful)
				emailName = 'GTC-REFUND-SUCCESS';
			const orderItemResponse = await model[orderItemModelName].findOne({
				where: {
					id: itemId,
				},
				attributes: ['id', 'order_id', 'product_id', 'reason_for_return','quantity', 'price', 'status', 'order_item_status', 'last_updated_by'],
				include: [{
					model: model['Order'],
					attributes: ['id', 'ordered_date', 'user_id', 'total_price'],
					include: [{
						model: model['User'],
						attributes: ['id', 'first_name', 'user_contact_email']
					}]
				}, {
					model: model['Product'],
					attributes: ['id', 'vendor_id', 'product_name'],
					include: [{
						model: model['Vendor'],
						attributes: ['id', 'user_id'],
						include: [{
							model: model['User'],
							attributes: ['id', 'first_name', 'user_contact_email']
						}]
					}, {
						model: model['ProductMedia'],
						where: {
							status: status['ACTIVE'],
							base_image: 1
						},
						attributes: ['id', 'product_id', 'type', 'url', 'base_image']
					}]
				}]
			});
			var orderItem = await JSON.parse(JSON.stringify(orderItemResponse));
			if (orderItem) {
				if (emailName) {
					const orderItemStatusEmailTemplate = await service.findOneRow(emailTemplateModelName, {
						name: emailName
					});
					if (orderItemStatusEmailTemplate) {
						let email;
						let orderStatusSubject = orderItemStatusEmailTemplate.subject;
						let orderStatusBody = orderItemStatusEmailTemplate.body;
						orderItem.Order.ordered_date = moment(orderItem.Order.ordered_date).format('MMM D, Y');
						if ((code == config.notification.templates.refundRequest) && 
							orderItem.Product.Vendor.User.user_contact_email) {
							orderStatusBody = orderStatusBody.replace('%status%', 'request for return');
							email = orderItem.Product.Vendor.User.user_contact_email;
						} else if ((code == config.notification.templates.refundProcessing) &&
							orderItem.Order.User.user_contact_email) {
							orderStatusBody = orderStatusBody.replace('%status%', 'refund processing');
							email = orderItem.Order.User.user_contact_email;
						} else if ((code == config.notification.templates.refundSuccessful) &&
							orderItem.Order.User.user_contact_email) {
							orderStatusBody = orderStatusBody.replace('%status%', 'refund successfully');
							email = orderItem.Order.User.user_contact_email;
						}
						let template = Handlebars.compile(orderStatusBody);
						let result = template(orderItem);
						if (email) {
							await sendEmail({
								to: email,
								subject: orderStatusSubject,
								html: result
							});
						}
					}
				}

				const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
					code: code
				});
				if (notificationSettingResponse) {
					var bodyParams = {};
					bodyParams.user_id = orderItem.Order.user_id;
					bodyParams.description = notificationSettingResponse.description;
					bodyParams.description = bodyParams.description.replace('%FirstName%', orderItem.Order.User.first_name);
					bodyParams.description = bodyParams.description.replace('%Refund_Amount%', orderItem.price);
					bodyParams.description = bodyParams.description.replace('%track%', '/order-history/' + orderItem.order_id + '/track-order-item/' + orderItem.id);
					bodyParams.description = bodyParams.description.replace('%order%', orderItem.order_id);
					bodyParams.description = bodyParams.description.replace('%#vendor_url%', '/vendor/' + orderItem.Product.vendor_id);
					bodyParams.name = notificationSettingResponse.name;
					bodyParams.code = notificationSettingResponse.code;
					bodyParams.is_read = 0;
					bodyParams.status = 1;
					bodyParams.created_on = new Date();
					bodyParams.created_by = "Administrator";
					const notificationResponse = await service.createRow(notificationModelName, bodyParams);
				}
			}
		}

		// product review notification
		if (code == config.notification.templates.productReview) {

			const VendorNotificationResponse = await service.findRow(vendorNotificationModelName, {
				code: code
			});
			if (VendorNotificationResponse) {
				const reviewId = job.attrs.data.reviewId;
				const reviewResponse = await model[reviewModelName].findOne({
					where: {
						id: reviewId,
					},
					attributes: ['id', 'product_id', 'user_id', 'status'],
					include: [{
						model: model['Product'],
						attributes: ['id', 'vendor_id', 'product_slug', 'product_name'],
						include: [{
							model: model['Vendor'],
							attributes: ['id', 'user_id'],
							include: [{
								model: model['User'],
								attributes: ['first_name', 'id']
							}]
						}]
					}]
				});

				const review = await JSON.parse(JSON.stringify(reviewResponse));
				if(review) {
					const vendorNotificationSettingsRes = await service.findRow(vendorNotificationSettingsModelName, {
						vendor_id: review.Product.Vendor.id,
						vendor_notification_id: VendorNotificationResponse.id
					});
					if (vendorNotificationSettingsRes == null) {
						const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
							code: code
						});
						if (notificationSettingResponse) {
							var bodyParams = {};
							bodyParams.user_id = review.Product.Vendor.user_id;
							bodyParams.description = notificationSettingResponse.description;
							bodyParams.description = bodyParams.description.replace('%VendorFirstname%', review.Product.Vendor.User.first_name);
							bodyParams.description = bodyParams.description.replace('%productName%', review.Product.product_name);
							bodyParams.description = bodyParams.description.replace('%path%', '/shop/' + review.Product.product_slug + '/' + review.product_id);
							bodyParams.description = bodyParams.description.replace('%#path%', '/shop/' + review.Product.product_slug + '/' + review.product_id +'/reviews');
							bodyParams.name = notificationSettingResponse.name;
							bodyParams.code = notificationSettingResponse.code;
							bodyParams.is_read = 0;
							bodyParams.status = 1;
							bodyParams.created_on = new Date();
							bodyParams.created_by = "Administrator";
							const notificationResponse = await service.createRow(notificationModelName, bodyParams);
						}
					}
				}
			}
		}

		// new post notification for buyer dashboard 
		if (code == config.notification.templates.newPostFromBuyerOnYourDB) {

			const discussionBoardPostId = job.attrs.data.discussionId;
			const VendorNotificationResponse = await service.findRow(vendorNotificationModelName, {
				code: code
			});
			if (VendorNotificationResponse) {
				const discussionBoardPostResponse = await model[discussionBoardPostModelName].findOne({
					where: {
						id: discussionBoardPostId,
					},
					attributes: ['id', 'vendor_id', 'user_id', 'status'],
					include: [{
						model: model['Vendor'],
						attributes: ['id', 'user_id'],
						include: [{
							model: model['User'],
							attributes: ['first_name', 'id']
						}]
					}, {
						model: model['User'],
						attributes: ['first_name', 'id']
					}]
				});

				const discussion = await JSON.parse(JSON.stringify(discussionBoardPostResponse));
				if (discussion) {

					const vendorNotificationSettingsRes = await service.findRow(vendorNotificationSettingsModelName, {
						vendor_id: discussion.Vendor.id,
						vendor_notification_id: VendorNotificationResponse.id
					});
					if (vendorNotificationSettingsRes == null) {
						const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
							code: code
						});
						if (notificationSettingResponse) {
							var bodyParams = {};
							bodyParams.user_id = discussion.Vendor.user_id;
							bodyParams.description = notificationSettingResponse.description;
							bodyParams.description = bodyParams.description.replace('%VendorFirstname%', discussion.Vendor.User.first_name);
							bodyParams.description = bodyParams.description.replace('%User%', discussion.User.first_name);
							bodyParams.description = bodyParams.description.replace('%postId%', '/vendor/discussion-board/' + discussion.Vendor.id);
							bodyParams.name = notificationSettingResponse.name;
							bodyParams.code = notificationSettingResponse.code;
							bodyParams.is_read = 0;
							bodyParams.status = 1;
							bodyParams.created_on = new Date();
							bodyParams.created_by = "Administrator";
							const notificationResponse = await service.createRow(notificationModelName, bodyParams);
						}
					}
				}
			}
		}

		// likes and comment notification
		if (code == config.notification.templates.likesComments) {
			var modelName, id;
			const VendorNotificationResponse = await service.findRow(vendorNotificationModelName, {
				code: code
			});
			if (VendorNotificationResponse) {
				if (job.attrs.data.discussionCommentId) {
					modelName = discussionBoardPostCommentModelName;
					id = job.attrs.data.discussionCommentId;
				} else {
					modelName = discussionBoardPostLikeModelName;
					id = job.attrs.data.discussionLikeId;
				}
				const discussionBoardCommentAndLikeRes = await model[modelName].findOne({
					where: {
						id: id
					},
					attributes: ['id', 'discussion_board_post_id', 'user_id', 'status'],
					include: [{
						model: model['DiscussionBoardPost'],
						attributes: ['id', 'vendor_id', 'user_id', 'status'],
						include: [{
							model: model['Vendor'],
							attributes: ['id', 'user_id'],
							include: [{
								model: model['User'],
								attributes: ['first_name', 'id']
							}]
						}]
					}, {
						model: model['User'],
						attributes: ['first_name', 'id']
					}]
				});
				const discussionBoardCommentAndLike = await JSON.parse(JSON.stringify(discussionBoardCommentAndLikeRes));
				
				if (discussionBoardCommentAndLike) {
	
					const vendorNotificationSettingsRes = await service.findRow(vendorNotificationSettingsModelName, {
						vendor_id: discussionBoardCommentAndLike.DiscussionBoardPost.Vendor.id,
						vendor_notification_id: VendorNotificationResponse.id
					});
					
					if (vendorNotificationSettingsRes == null) {

						const notificationSettingResponse = await service.findRow(notificationSettingModelName, {
							code: code
						});
						if (notificationSettingResponse) {
							var bodyParams = {};
							bodyParams.user_id = discussionBoardCommentAndLike.DiscussionBoardPost.Vendor.user_id;
							bodyParams.description = notificationSettingResponse.description;
							bodyParams.description = bodyParams.description.replace('%VendorFirstname%', discussionBoardCommentAndLike.DiscussionBoardPost.Vendor.User.first_name);
							bodyParams.description = bodyParams.description.replace('%User%', discussionBoardCommentAndLike.User.first_name);
							bodyParams.description = bodyParams.description.replace('%PostId%', '/vendor/discussion-board/' + discussionBoardCommentAndLike.DiscussionBoardPost.Vendor.id);
							bodyParams.name = notificationSettingResponse.name;
							bodyParams.code = notificationSettingResponse.code;
							bodyParams.is_read = 0;
							bodyParams.status = 1;
							bodyParams.created_on = new Date();
							bodyParams.created_by = "Administrator";
							const notificationResponse = await service.createRow(notificationModelName, bodyParams);
						}
					}
				}
			}
		}
		done();
	} catch (error) {
		done(error);
	}
};