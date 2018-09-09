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

	baseUrl: process.env.DOMAIN,

	secureBaseURL: process.env.SECURE_BASE_URL || process.env.DOMAIN,
	// Root path of server
	root: path.normalize(`${__dirname}/../../..`),

	// Browser-sync port
	browserSyncPort: process.env.BROWSER_SYNC_PORT || 3600,

	// Server port
	port: process.env.PORT || 9000,

	// Server IP
	ip: process.env.IP || '0.0.0.0',

	// Should we populate the DB with sample data?
	seedDB: false,

	paginationLimit: 10,

	wooCommercePerPageLimit: process.env.WOO_COMMERCE_PER_PAGE_LIMIT || 50,
	aliExpressLoginId: process.env.ALI_EXPRESS_USER_ID || "chandrumail4u@gmail.com",
	aliExpressLoginPassword: process.env.ALI_EXPRESS_USER_PASSWORD || "13229502",

	clientURL: process.env.CLIENT_BASE_URL,

	images_base_path: process.env.BASE_URL_LOCAL_UPLOAD,

	imageUrlRewritePath: {
		base: "/images/"
	},

	secrets: {
		session: 'gtc-secret',
		refTokenKey: process.env.REFRESH_TOKEN_KEY_SECRET,
		globalAccessToken: process.env.GLOBAL_ACCESS_TOKEN_SECRET,
		accessToken: process.env.ACCESS_TOKEN_SECRET,
		refreshToken: process.env.REFRESH_TOKEN_SECRET
	},

	ebay: {
		clientId: process.env.EBAY_CLIENT_ID,
		clientSecret: process.env.EBAY_CLIENT_SECRET,
		redirectUri: process.env.EBAY_REDIRECT_URI,
		entriesPerPage: 100,
		authURL: 'https://api.ebay.com/identity/v1/oauth2/token',
		sellerListURL: 'https://api.ebay.com/ws/api.dll'
	},

	//Email
	email: {
		templates: {
			userCreate: 'USER-CREATE',
			orderMail: 'ORDER-MAIL',
			itemCancel: 'ITEM-CANCEL-BY-VENDOR-MAIL',
			userOrderDetail: 'USER-ORDER-DETAIL-MAIL',
			vendorNewOrder: 'VENDOR-NEW-ORDER',
			passwordReset: 'PASSWORD-RESET',
			stripeConnectEmail: 'STRIPE-CONNECT-MAIL',
			payoutMail: 'PAYOUT-MAIL',
			askToVendor: 'ASK-TO-VENDOR',
			returnRequest: 'USER-RETURN-REQUEST'
		}
	},
	jobs: {
		'email': 'email-notification',
		"couponExpiry": "couponExpiry",
		"vendorPayouts": "vendorPayouts",
		"aliExpressScrape": "aliexpress-scrape",
		"ebayInventory": "ebay-inventory",
		"amazonImportJob": "amazonImportJob"
	},
	sesTransporter: {
		accessKeyId: process.env.SES_ACCESS_KEY_ID,
		secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
		from: process.env.SES_TRANSPORTER_FROM
	},

	smtpTransport: {
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		from: process.env.SMTP_FROM,
		auth: {
			user: process.env.SMTP_AUTH_USER,
			pass: process.env.SMTP_AUTH_PASS
		}
	},

	googleLogin: {
		clientId: process.env.GOOGLE_CLIENT_ID,
		secretKey: process.env.GOOGLE_SECRET_KEY,
		accessTokenUrl: 'https://accounts.google.com/o/oauth2/token',
		peopleApiUrl: 'https://www.googleapis.com/plus/v1/people/me/openIdConnect'
	},
	facebookLogin: {
		clientId: process.env.FACEBOOK_CLIENT_ID,
		secretKey: process.env.FACEBOOK_SECRET_KEY,
		accessTokenUrl: 'https://graph.facebook.com/oauth/access_token',
		peopleApiUrl: 'https://graph.facebook.com/me?fields=',
		fields: ['id', 'email', 'first_name', 'last_name', 'link', 'name']
	},
	linkedInLogin: {
		clientId: process.env.LINKEDIN_CLIENT_ID,
		secretKey: process.env.LINKEDIN_SECRET_KEY,
		accessTokenUrl: 'https://www.linkedin.com/uas/oauth2/accessToken',
		peopleApiUrl: 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,picture-url,email-address)?format=json'
	},
	twitterLogin: {
		clientId: process.env.TWITTER_CLIENT_ID,
		secretKey: process.env.TWITTER_SECRET_KEY,
		requestTokenUrl: "https://api.twitter.com/oauth/request_token",
		accessTokenUrl: "https://api.twitter.com/oauth/access_token",
		peopleApiUrl: "https://api.twitter.com/1.1/account/verify_credentials.json"
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

	stripeConfig: {
		keyPublishable: process.env.STRIPE_PUBLISHABLE_KEY,
		keySecret: process.env.STRIPE_SECRET_KEY
	},

	payPalConfig: {
		'mode': 'sandbox', //sandbox or live
		'client_id': process.env.PAYPAL_CLIENT_ID,
		'client_secret': process.env.PAYPAL_SECRET_KEY
	},

	amazonImportConfig: {
		accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
		secretAccessKey: process.env.AMAZON_SECRET_KEY,
		developerId: process.env.AMAZON_DEVELOPER_ID
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