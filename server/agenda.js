'use strict';

var Agenda = require('agenda');
var config = require('./config/environment');

// Define New Agenda
module.exports = new Agenda({
    db: {
        address: config.mongo.uri,
        collection: "agenda",
        options: {
            autoReconnect: true,
            useNewUrlParser: true
        }
    }
});