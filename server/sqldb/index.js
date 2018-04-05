'use strict';

import Sequelize from 'sequelize';
import config from '../config/environment';

var sequelizeDB = new Sequelize('test', 'ibc', 'ibc', {
	host: '192.168.2.11',
	dialect: 'mysql',
	port: 3306,
	define: {
        timestamps: false
    }
});
 
module.exports = sequelizeDB;