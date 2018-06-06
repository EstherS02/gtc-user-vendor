'use strict';
/*eslint no-process-env:0*/

import path from 'path';
import _ from 'lodash';

/*function requiredProcessEnv(name) {
if(!process.env[name]) {
  throw new Error('You must set the ' + name + ' environment variable');
}
return process.env[name];
}*/

var baseUrl = process.env.DOMAIN;

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(`${__dirname}/../../..`),

  // Browser-sync port
  browserSyncPort: process.env.BROWSER_SYNC_PORT || 2000,

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Should we populate the DB with sample data?
  seedDB: false,

  paginationLimit: 10,

  clientURL: process.env.CLIENT_BASE_URL,

  images_base_path: process.env.BASE_URL_LOCAL_UPLOAD,

  imageUrlRewritePath: {
    base: "/images/"
  },

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'gtc-secret',
    refTokenKey: process.env.REFRESH_TOKEN_KEY_SECRET,
    globalAccessToken: process.env.GLOBAL_ACCESS_TOKEN_SECRET,
    accessToken: process.env.ACCESS_TOKEN_SECRET,
    refreshToken: process.env.REFRESH_TOKEN_SECRET
  },

  googleLogin: {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET_KEY,
    googleAccessTokenUrl: 'https://accounts.google.com/o/oauth2/token',
    googlePeopleApiUrl: 'https://www.googleapis.com/plus/v1/people/me/openIdConnect'
  },

  mysql: {
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DATABASE,
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT
  },

  token: {
    expiresInMinutes: process.env.TOKEN_EXPIRES_IN_MIN || 600
  },

  auth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    url: baseUrl + "/auth/token",
  },

  adminAuth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    url: baseUrl + "/auth/admin-token",
  },

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./shared'),
  require(`./${process.env.NODE_ENV}.js`) || {});