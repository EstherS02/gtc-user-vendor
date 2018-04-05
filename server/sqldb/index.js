'use strict';

import Sequelize from 'sequelize';
import config from '../config/environment';


var sequelizeDB = new Sequelize(config.sequelize.mysql_db, config.sequelize.mysql_user, config.sequelize.mysql_pwd, {
	host: config.sequelize.mysql_host,
	dialect: 'mysql',
	port: config.sequelize.mysql_port,
	define: {
        timestamps: false
    }
});
 
module.exports = sequelizeDB;