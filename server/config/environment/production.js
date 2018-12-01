'use strict';
/*eslint no-process-env:0*/

// Production specific configuration
// =================================
module.exports = {
	// Server IP
	ip: process.env.OPENSHIFT_NODEJS_IP ||
		process.env.ip ||
		undefined,

	// Server port
	port: process.env.OPENSHIFT_NODEJS_PORT ||
		process.env.PORT ||
		8080,

	sequelize: {
		uri: process.env.SEQUELIZE_URI ||
			'sqlite://',
		options: {
			logging: false,
			storage: 'dist.sqlite',
			define: {
				timestamps: false
			}
		}
	},
	mongo: {
		uri: process.env.MONGODB_URI ||
			process.env.MONGOHQ_URL ||
			process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME ||
			'mongodb://192.168.2.30/gtc-v2'
	}
};