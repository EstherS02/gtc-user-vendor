// 'use strict';

// var sendRsp = require('../../utils/response').sendRsp;
// var log = require('../../libs/log')(module);
// // import msgThread from '../models/msgthread.model';
// import resourceModel from '../../config/resource';
// var ObjectId = require('mongoose').Types.ObjectId;
// import _ from 'lodash';
// import moment from 'moment';

// exports.create = function(req, res) {
// 	var queryObj = {};
// 	queryObj.users = [req.body.send];
// 	msgThread.find(queryObj, function(err, threads) {

// 		if (threads.length > 0) {
// 			console.log("length > 0");
// 			return sendRsp(res, 201, 'Created');
// 			//createMessage(req, res, threads[0])
// 		} else {
// 			var newThread = new msgThread({
// 				users: [req.body.send]
// 			});
// 			newThread.save(function(err, thread) {
// 				console.log("thread", thread);
// 				if (!err) {
// 					log.info("thread created");
// 					return sendRsp(res, 201, 'Created');
// 					//createMessage(req, res, thread)
// 				} else {
// 					if (err.name === 'ValidationError') {
// 						sendRsp(res, 400, 'Validation error');
// 						return;
// 					} else {
// 						sendRsp(res, 500, 'Server error');
// 						return;
// 					}
// 					log.error('Internal error(%d): %s', res.statusCode, err.message);
// 				}
// 			});
// 		}
// 	});
// }

// function createMessage(req, res, thread) {
// 	console.log("TIME FRAME", moment().format());
// 	var newMsg = new resourceModel['messages']({
// 		send: req.user.id,
// 		message: req.body.message,
// 		thread: thread._id,
// 		date: moment().format(),
// 		created_by: req.user.id
// 	});
// 	console.log("************NEW MESSAGE***********", newMsg);
// 	newMsg.save(function(err, message) {
// 		console.log("err", err)
// 		console.log("message", message);
// 		if (!err && message) {
// 			console.log("res.statusCode", res.statusCode);
// 			sendRsp(res, 201, 'Created', {
// 				"message": message
// 			});
// 			return;
// 		} else {
// 			if (err.name === 'ValidationError') {
// 				sendRsp(res, 400, 'Validation error');
// 				return;
// 			} else {
// 				sendRsp(res, 500, 'Server error');
// 				return;
// 			}
// 			log.error('Internal error(%d): %s', res.statusCode, err.message);
// 		}
// 	});
// }

// export function msgCreate(messages) {
// 	return new Promise(function(resolve, reject) {
// 		var queryObj = {};
// 		queryObj.send = messages.send;
// 		queryObj.message = messages.message;
// 		queryObj.created_by = messages.send;
// 		queryObj.thread = new ObjectId(messages.thread);
// 		queryObj.date = moment().format();
// 		//console.log("queryObj", queryObj);
// 		resourceModel['messages'].create(queryObj).then(function(newMsg) {
// 			if (newMsg) {
// 				var options = [{
// 					path: 'send',
// 					select: "username first_name email status image_url online",
// 					model: 'User'
// 				}];
// 				resourceModel['messages'].populate(newMsg, options, function(err, resp) {
// 					if (err) {
// 						reject();
// 					} else if (resp) {
// 						resolve(resp);
// 					}
// 				})
// 			}
// 		}).catch(function(err) {
// 			reject({});
// 		})
// 	})
// }