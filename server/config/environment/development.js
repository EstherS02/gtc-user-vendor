'use strict';
/*eslint no-process-env:0*/

// Development specific configuration
// ==================================
module.exports = {

  // Sequelize connection opions
  sequelize: {
    mysql_db: process.env.MYSQL_DATABASE,
    mysql_user: process.env.MYSQL_USERNAME,
    mysql_pwd: process.env.MYSQL_PASSWORD,
    mysql_host: process.env.MYSQL_HOST,
    mysql_port: process.env.MYSQL_PORT
  },

  // Seed database on startup
  seedDB: true

};