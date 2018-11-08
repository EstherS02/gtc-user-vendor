'use strict';
/*eslint no-process-env:0*/

// Development specific configuration
// ==================================
module.exports = {
	// Sequelize connection opions
	sequelize: {
		uri: 'sqlite://',
		options: {
			logging: false,
			storage: 'dev.sqlite',
			define: {
				timestamps: false
			}
		}
	},
	mongo: {
		uri: 'mongodb://192.168.2.163:27017/gtc-v2'
	},
	// Seed database on startup
	seedDB: true
};