const permissions = require('./permission.js');
const roles = require('./roles.js');
const resources = require('./resources.js');

var rolePermissions = {};

rolePermissions[roles["1"]] = {};
rolePermissions[roles["2"]] = {};
rolePermissions[roles["3"]] = {};

// Permissions for USERS
rolePermissions[roles["3"]][resources.PRODUCT] = [permissions.VIEW].join(" ");