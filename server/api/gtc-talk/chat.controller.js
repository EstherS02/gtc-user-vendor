'use strict';

const expressValidator = require('express-validator');
const config = require('../../config/environment');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');

const service = require('../service');
const model = require('../../sqldb/model-connect');

export function chatConversation(req, res) {
	var LoggedInUser = {};

	var thread_id = req.body.thread_id;
	var includeArr = [{
		model: model['User'],
		attributes: {
			exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
		}
	}];
	var modelName = "Talk";
	var queryObj = {talk_thread_id:thread_id};
	var offset = 0;
	var limit = null;
	var field = "created_on";
	var order = "desc";

	service.findRows(modelName, queryObj, offset, limit, field, order, includeArr).then(function(response){
		console.log("talk", response);
			if (response) {
				return res.status(200).json({
							talkThread: response.rows,
							threadId: req.body.thread_id,
							talk: null
						});
				
			} else {
				return res.status(200).json({
							talkThread: null,
							threadId: req.body.thread_id,
							talk: null
						});
			}
			
	});





	// if (LoggedInUser.id != null) {
	// 	service.findOneRow('Vendor', vendorID, includeArr)
	// 		.then(function(response) {

	// 			var talkIncludeArr = [];
	// 			var talkThreadUsersQueryObj = {};

	// 			talkThreadUsersQueryObj['user_id'] = {
	// 				'$in': [response.user_id, LoggedInUser.id]
	// 			}
	// 			model['TalkThreadUsers'].findAll({
	// 				where: talkThreadUsersQueryObj,
	// 				attributes: ['id', 'thread_id', 'user_id']
	// 			}).then(function(instance) {
	// 				var talkUserCheck = JSON.parse(JSON.stringify(instance));
	// 				console.log("INSTANCE", JSON.parse(JSON.stringify(instance)));

	// 				var threadArr = _.intersection(_.map(_.filter(talkUserCheck, function(o) {
	// 					return o.user_id == response.user_id;
	// 				}), 'thread_id'), _.map(_.filter(talkUserCheck, function(o) {
	// 					return o.user_id == LoggedInUser.id;
	// 				}), 'thread_id'));

	// 				if (threadArr.length > 0) {
	// 					console.log("Match ID", threadArr[0]);
	// 					var talkThread = {};
	// 					talkThread['talk_thread_id'] = threadArr[0];
	// 					model['Talk'].findAll({
	// 						where: talkThread
	// 					}).then(function(talk) {
	// 						//console.log("talk", talk);
	// 						if (talk.length > 0) {
	// 							console.log("talkThread", {
	// 								threadId: threadArr[0],
	// 								talk: JSON.parse(JSON.stringify(talk))
	// 							})
	// 							callback(null, {
	// 								threadId: threadArr[0],
	// 								talk: JSON.parse(JSON.stringify(talk))
	// 							});
	// 						} else {
	// 							console.log("start new conversation");
	// 							callback(null, null);
	// 						}
	// 					}).catch(function(err) {
	// 						console.log("Error:::", err);
	// 					})
	// 				} else {
	// 					console.log("No threads found");
	// 					//callback(null);
	// 					var bodyParams = {};
	// 					bodyParams['talk_thread_status'] = 1;
	// 					bodyParams['status'] = 1;
	// 					model['TalkThread'].create(bodyParams).then(function(talkThread) {
	// 						if (talkThread) {
	// 							var talkThreadJSON = JSON.parse(JSON.stringify(talkThread));
	// 							var talkTreadModel = 'TalkThreadUsers';
	// 							var talkThreadUserObj = [{
	// 								'talk_thread_status': 1,
	// 								'status': 1,
	// 								'thread_id': talkThreadJSON.id,
	// 								'user_id': LoggedInUser.id
	// 							}, {
	// 								'talk_thread_status': 1,
	// 								'status': 1,
	// 								'thread_id': talkThreadJSON.id,
	// 								'user_id': response.user_id
	// 							}];

	// 							service.createBulkRow(talkTreadModel, talkThreadUserObj)
	// 								.then(function(talkThreadUser) {
	// 									console.log("TalkThreadUsers created", JSON.parse(JSON.stringify(talkThreadUser)));
	// 									return res.status(200).json({

	// 										talkThread: talkThreadJSON.id,
	// 										threadId: talkThreadJSON.id,
	// 										talk: null
	// 									})
	// 								})
	// 								.catch(function(err) {
	// 									console.log("err", err);
	// 									// callback(null);
	// 									return res.status(500).json({
	// 										talkThread: null,
	// 										threadId: null,
	// 										talk: null
	// 									})
	// 								})


	// 						}
	// 					}).catch(function(err) {
	// 						console.log("err", err)
	// 					})
	// 				}

	// 			}).catch(function(error) {
	// 				console.log("Error:::", error);
	// 				return res.status(500).json({
	// 					talkThread: null,
	// 					threadId: null,
	// 					talk: null
	// 				})
	// 			})
	// 		}).catch(function(error) {
	// 			console.log("Error:::", error);
	// 			return res.status(500).json({
	// 				talkThread: null,
	// 				threadId: null,
	// 				talk: null
	// 			})
	// 		})
	// } else {
	// 	console.log("****DOESN't LOGIN IN******");
	// 	return res.status(500).json({
	// 		talkThread: null,
	// 		threadId: null,
	// 		talk: null
	// 	})
	// }
}