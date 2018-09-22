'use strict';

var async = require("async");
const sequelize = require('sequelize');
const service = require('../service');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const Sequelize_Instance = require('../../sqldb/index');
const RawQueries = require('../../raw-queries/sql-queries');
const roles = require('../../config/roles');
const model = require('../../sqldb/model-connect');

export function notification(Id,queryObj){
	
}