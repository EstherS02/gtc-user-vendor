'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');

export function blogLike(req, res) {
	var queryObj = {
		user_id: req.user.id,
		discussion_board_post_id: req.body.id
	};
	var modelName = "DiscussionBoardPostLike";
	model[modelName].findOne({
		where: queryObj
	}).then(function(result) {
		if (result) {
			var newStatus;
			if (result.status == status['ACTIVE']) {
				newStatus = 0;
			} else {
				newStatus = 1;
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
					res.status(200).send(response);
					return;
				});
		} else {
			var bodyParam = {};
			bodyParam.discussion_board_post_id = req.body.id;
			bodyParam.user_id = req.user.id;
			bodyParam.status = 1;
			bodyParam.created_on = new Date();
			service.createRow(modelName, bodyParam).then(function(response) {
				res.status(200).send(response);
				return;
			});
			// console.log(i, "not in db")
		}
	});

}

export function blogComment(req, res) {
	var modelName = "DiscussionBoardPostComment";

	var bodyParam = {};
	bodyParam.discussion_board_post_id = req.body.discussion_board_post_id;
	bodyParam.comment_type = req.body.comment_type;
	bodyParam.comment = req.body.comment;
	bodyParam.comment_media_url = req.body.comment_media_url;
	bodyParam.user_id = req.user.id;
	bodyParam.status = 1;
	bodyParam.created_on = new Date();
	console.log("-------------------==================-------------",bodyParam)
	service.createRow(modelName, bodyParam).then(function(response) {
		// res.status(200).send(response);
		console.log("-------------------==================-------------",response)
		return res.status(200).send(response);
	});
	// console.log(i, "not in db")
}