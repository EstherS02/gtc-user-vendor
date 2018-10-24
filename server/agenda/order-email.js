'use strict';

const config = require('../config/environment');

module.exports = async function(job, done) {
	console.log("job 000 ----------------------", job.attrs.data.order);
}