'use strict';

const expressValidator = require('express-validator');
const config = require('../../config/environment');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');
const sequelize = require('sequelize');
const service = require('../service');
const model = require('../../sqldb/model-connect');

export function talkCounts(req, res) {
	//console.log("REQUEST", req);
	var threadsUnRead = [];
	model['TalkThreadUser'].findAll({
		where: {
			user_id: req.user.id
		},
	}).then(function(instances) {
		for (var i = 0, iLen = instances.length; i < iLen; i++) {
			threadsUnRead.push(instances[i].thread_id);
		}
	}).then(function(results) {
		model['Talk'].findAll({
			raw: true,
			where: {
				from_id: {
					$ne: req.user.id
				},
				talk_thread_id: {
					$in: threadsUnRead
				},
				is_read: 0
			},
			attributes: ['talk_thread_id', [sequelize.fn('count', 1), 'count']],
			group: ['talk_thread_id']
		}).then(function(results1) {

			console.log("RESULTS1", results1.length)
			res.status(200).send(results1);
			return;
		});
	}).catch(function(err) {
		res.status(500).send(err);
		return;
	})
}

export function talkCreate(talk) {
	return new Promise(function(resolve, reject) {
		var bodyParams = {
			'from_id': talk.from_id,
			'created_by': talk.from_id,
			'message': talk.message,
			'talk_thread_id': talk.talk_thread_id,
			'created_on': new Date(),
			'sent_at': new Date(),
			'talk_status': 1,
			'status': 1,
			'is_read': 0
		};
		model['Talk'].create(bodyParams).then(function(response) {
			var includeArr = [{
				model: model["User"],
				attributes: {
					exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
				}
			}]
			var modelName = "Talk"
			service.findIdRow(modelName, response.id, includeArr)
				.then(function(resp) {
					//console.log("Message Response", resp);
					resolve(JSON.parse(JSON.stringify(resp)));
				}).catch(function(err) {
					reject(err);
				})
			/*model['TalkThreadUsers'].find*/
		}).catch(function(err) {
			reject(err);
		})
	})
}

export function talkCount(user) {
	return new Promise(function(resolve, reject) {
		var threadsUnRead = [];
		model['TalkThreadUser'].findAll({
			where: {
				user_id: user
			}, 
		}).then(function(instances) {
			for (var i = 0, iLen = instances.length; i < iLen; i++) {
				threadsUnRead.push(instances[i].thread_id);
			}
		}).then(function(results) {
			model['Talk'].findAll({
				raw: true,
				where: {
					from_id: {
						$ne: user
					},
					talk_thread_id: {
						$in: threadsUnRead
					},
					is_read: 0
				},
				attributes: ['talk_thread_id', [sequelize.fn('count', 1), 'count']],
				group: ['talk_thread_id']
			}).then(function(results1) {
				resolve(results1.length);
			});
		}).catch(function(err) {
			reject(err)
		})
	})
}