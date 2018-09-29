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
	var type = 'Unlike';
	var newStatus;
	var queryObj = {
		user_id: req.user.id,
		discussion_board_post_id: discussion_board_post_id
	};
	req.body.discussion_board_post_id = req.body.id;
	var modelName = "DiscussionBoardPostLike";
	req.body.modelName = "DiscussionBoardPostLike";
	var bodyParam = {};
	bodyParam.user_id = req.user.id;
	bodyParam.discussion_board_post_id = req.body.id;
	bodyParam.status = 1;

	service.findOneRow(modelName,queryObj,[]).then(function(result) {
		if (result) {
			if (result.status == status['ACTIVE']) {
				newStatus = 0;
				type = 'Like';
			} else {
				notification(req,null);
				newStatus = 1;
				type = 'Unlike';
			}
			bodyParam.last_updated_on = new Date();
			bodyParam.status= newStatus;
			service.updateRow(modelName,bodyParam,result.id)
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
			bodyParam.created_on = new Date();
			service.createRow(modelName, bodyParam).then(function(response) {
				discussion_board_post_id= response.discussion_board_post_id;
				notification(req,null);
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
		}
	});

}

function notification (req,postId){

	var modelName = "DiscussionBoardPost";
	var TemplateModel = 'NotificationSetting';
	var queryObj={};
	var includeArr = [{
		model:model['Vendor'],
		include:[{
			model:model['User'],
			attributes:['id','first_name','last_name']
		}]
	}];
	var post_id=0;
	if(req.body.discussion_board_post_id){
		post_id = req.body.discussion_board_post_id;postId;
		queryObj['code'] = config.notification.templates.likesComments;
	}else{
		post_id = postId;
		queryObj['code'] = config.notification.templates.newPostFromBuyerOnYourDB;
	}

	service.findIdRow(modelName,post_id,includeArr).then(function(response1){
		if(response1){
			service.findOneRow(TemplateModel, queryObj)
			.then(function(response) {
			var bodyParams = {};
			bodyParams.user_id = response1.Vendor.User.id;
			var description = response.description;
			description = description.replace('%VendorFirstname%',response1.Vendor.User.first_name);
			description = description.replace('%PostId%', '/vendor/discussion-board/' +response1.Vendor.id);
			description = description.replace('%VendorLastName%',response1.Vendor.User.last_name); 
			description = description.replace('%User%',req.user.first_name); 
			bodyParams.description = description;
			bodyParams.name = response.name;
			bodyParams.code = response.code;
			bodyParams.is_read = 1;
			bodyParams.status = 1;
			bodyParams.created_on = new Date();
			service.createRow("Notification", bodyParams).then(function(response){
				return;
			});
		});
			return;
		}
		else{
			return;
		}
	})
}
function LikeCount(req, res, callback) {
	var modelName = req.body.modelName;
	var queryObj = {
		discussion_board_post_id: req.body.discussion_board_post_id,
		status: status['ACTIVE']
	};


	model[modelName].findAndCountAll({
		where: queryObj,
		include: [{
			model: model["User"],
			attributes: {
				exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
			},
		}],
		order: [
			['created_on', 'desc']
		]
	}).then(function(result) {
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
		notification(req,null);
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
		if(req.body.vendor_id != req.user.Vendor.id){
			notification(req,response.id);
		}
		return res.status(200).send(response);
	});
}
export function upsert(req, res) {
	var bodyParams = req.body;
	bodyParams["last_updated_on"] = new Date();
	var queryObj = {
		vendor_id: req.body.vendor_id
	}
	service.upsertRow("TermsAndCond", bodyParams, queryObj)
		.then(function(result) {
			return res.status(201).send("Updated Successfully");
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}