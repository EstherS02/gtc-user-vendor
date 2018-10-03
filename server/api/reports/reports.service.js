'use strict';

const moment = require('moment');
var _ = require('lodash');
const service = require('../service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');

export async function AccountingReport(queryParams) {
	console.log('AccountingReport ----------------------------', queryParams);
}