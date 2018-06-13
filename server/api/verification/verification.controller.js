'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');

export function storeData(req, res){
	
	// var uploadPath = config.images_base_path + "/" + file.originalFilename;
	console.log(req.body);
}