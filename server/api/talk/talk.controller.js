'use strict';

const expressValidator = require('express-validator');
const config = require('../../config/environment');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');

const service = require('../service');
const model = require('../../sqldb/model-connect');

export function talkCheck(req, res) {
	var userModel = "TalkThreadUsers";
}

export function talkCreate(talk) {
	return new Promise(function(resolve, reject) {
		var bodyParams = {
			'from_id': talk.from_id,
			'created_by': talk.from_id,
			'message': talk.message,
			'talk_thread_id': talk.talk_thread_id,
			'created_on': new Date(),
			'sent_at':new Date(),
			'talk_status': 1,
			'status': 1
		};
		model['Talk'].create(bodyParams).then(function(response) {
			/*model['TalkThreadUsers'].find*/
			resolve(JSON.parse(JSON.stringify(response)));
		}).catch(function(err){
			reject(err);
		})
	})
}
