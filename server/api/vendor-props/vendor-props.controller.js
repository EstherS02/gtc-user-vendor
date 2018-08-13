'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');

export function blogLike(req, res) {
	var discussion_board_post_id = req.body.id;
	var type = '';
	var queryObj = {
		user_id: req.user.id,
		discussion_board_post_id: discussion_board_post_id
	};
	req.body.discussion_board_post_id = req.body.id; 
	var modelName = "DiscussionBoardPostLike";
	req.body.modelName = "DiscussionBoardPostLike";
	model[modelName].findOne({
		where: queryObj
	}).then(function(result) {
		if (result) {
			var newStatus;
			if (result.status == status['ACTIVE']) {
				newStatus = 0;
				type = 'Like';
			} else {
				newStatus = 1;
				type = 'Unlike';
			}
			model[modelName].update({
					status: newStatus,
					last_updated_on: new Date()
				}, {
					where: {
						id: result.id
					}
				})
				.then(function(response) {
					LikeCount(req, res, function(err, obj) {
						if (err) {
							return res.status(500).json({
								count: 0,
								type: type
							});
						} else {
							return res.status(200).json({
								count: obj.count,
								type: type
							});
						}
					});
					return;
				});
		} else {
			var bodyParam = {};
			bodyParam.discussion_board_post_id = req.body.id;
			bodyParam.user_id = req.user.id;
			bodyParam.status = 1;
			bodyParam.created_on = new Date();
			service.createRow(modelName, bodyParam).then(function(response) {
				// res.status(200).send(response);
				LikeCount(req, res, function(err, obj) {
					if (err) {
						return res.status(500).json({
							count: 0,
							type: type
						});
					} else {
						return res.status(200).json({
							count: obj.count,
							type: type
						});
					}

				});
				return;
			});
			// console.log(i, "not in db")
		}
	});

}

function LikeCount(req, res, callback) {
	var modelName = req.body.modelName;
	var queryObj = {
		discussion_board_post_id: req.body.discussion_board_post_id,
		status: status['ACTIVE']
	};
	console.log(queryObj, modelName)
	model[modelName].findAndCountAll({
		where: queryObj,
		include:[{
			model: model["User"],
				attributes: {
					exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
				},
		}]
	}).then(function(result) {
		console.log("=-----------------------====================------------",result)
		return callback(null, result)
	});
}

export function blogComment(req, res) {
	var modelName = "DiscussionBoardPostComment";
	req.body.modelName = "DiscussionBoardPostComment";
	var bodyParam = {};
	bodyParam.discussion_board_post_id = req.body.discussion_board_post_id;
	bodyParam.comment_type = req.body.comment_type;
	bodyParam.comment = req.body.comment;
	bodyParam.comment_media_url = req.body.comment_media_url;
	bodyParam.user_id = req.user.id;
	bodyParam.status = 1;
	bodyParam.created_on = new Date();
	service.createRow(modelName, bodyParam).then(function(response) {
		// return res.status(200).send(response);

		LikeCount(req, res, function(err, obj) {
			if (err) {
				return res.status(500).json({
					result: err,
				});
			} else {
				return res.status(200).json({
					result: obj,
				});
			}

		});


	});
}

export function blogPost(req, res) {
	var modelName = "DiscussionBoardPost";
	var bodyParam = {};
	bodyParam.vendor_id = req.body.vendor_id;
	bodyParam.user_id = req.body.user_id;
	bodyParam.post_media_type = req.body.post_media_type;
	bodyParam.post_message = req.body.post_message;
	bodyParam.post_media_url = req.body.post_media_url;
	bodyParam.status = 1;
	bodyParam.created_on = new Date();
	service.createRow(modelName, bodyParam).then(function(response) {
		return res.status(200).send(response);
	});
}