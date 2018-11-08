'use strict';

import Sequelize from 'sequelize';
import config from '../config/environment';

var sequelizeDB = new Sequelize(config.mysql.database, config.mysql.username, config.mysql.password, {
	host: config.mysql.host,
	dialect: 'mysql',
	port: config.mysql.port,
	dialectOptions: {
		dateStrings: true,
		typeCast: true
	},
	define: {
		timestamps: false
	}
});

module.exports = sequelizeDB;