'use strict';

var MailListener = require("mail-listener2");
var config = require('../config/environment');

module.exports = new MailListener({
	username: "test@ibcpods.com",
	password: "ibc@2018&",
	host: "ibcpods.com",
	port: 993, // imap port
	tls: true,
	connTimeout: 10000, // Default by node-imap
	authTimeout: 5000, // Default by node-imap,
	//debug: console.log, // Or your custom function with only one incoming argument. Default: null
	tlsOptions: {
		rejectUnauthorized: false
	},
	mailbox: "INBOX", // mailbox to monitor
	searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved
	markSeen: true, // all fetched email willbe marked as seen and not fetched next time
	fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
	mailParserOptions: {
		streamAttachments: true
	}, // options to be passed to mailParser lib.
	attachments: true, // download attachments as they are encountered to the project directory
	attachmentOptions: {
		directory: "attachments/"
	} // specify a download directory for attachments
});