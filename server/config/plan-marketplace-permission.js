var plan = require('./gtc-plan.js');
var marketplace = require('./marketplace.js');

var planPermissions = {};

planPermissions[plan.STARTER_SELLER] = {};
planPermissions[plan.SERVICE_PROVIDER] = {};
planPermissions[plan.LIFESTYLE_PROVIDER] = {};
planPermissions[plan.PUBLIC_SELLER_PRICING_GUIDE] = {};
planPermissions[plan.BULK_BUYER] = {};
planPermissions[plan.WHOLESALE_PRICING_GUIDE] = {};

//permission for starter seller
planPermissions[plan.STARTER_SELLER][marketplace.WHOLESALE] = [];
planPermissions[plan.STARTER_SELLER][marketplace.PUBLIC] = ["*"];
planPermissions[plan.STARTER_SELLER][marketplace.SERVICE] = ["*"];
planPermissions[plan.STARTER_SELLER][marketplace.LIFESTYLE] = ["*"];

//permission for service provider
planPermissions[plan.SERVICE_PROVIDER][marketplace.WHOLESALE] = [];
planPermissions[plan.SERVICE_PROVIDER][marketplace.PUBLIC] = [];
planPermissions[plan.SERVICE_PROVIDER][marketplace.SERVICE] = ["*"];
planPermissions[plan.SERVICE_PROVIDER][marketplace.LIFESTYLE] = [];

//permission for lifestyle provider
planPermissions[plan.LIFESTYLE_PROVIDER][marketplace.WHOLESALE] = [];
planPermissions[plan.LIFESTYLE_PROVIDER][marketplace.PUBLIC] = [];
planPermissions[plan.LIFESTYLE_PROVIDER][marketplace.SERVICE] = [];
planPermissions[plan.LIFESTYLE_PROVIDER][marketplace.LIFESTYLE] = ["*"];

//permission for public seller
planPermissions[plan.PUBLIC_SELLER_PRICING_GUIDE][marketplace.WHOLESALE] = [];
planPermissions[plan.PUBLIC_SELLER_PRICING_GUIDE][marketplace.PUBLIC] = ["*"];
planPermissions[plan.PUBLIC_SELLER_PRICING_GUIDE][marketplace.SERVICE] = [];
planPermissions[plan.PUBLIC_SELLER_PRICING_GUIDE][marketplace.LIFESTYLE] = [];

//permission for bulk buyer
planPermissions[plan.BULK_BUYER][marketplace.WHOLESALE] = [];
planPermissions[plan.BULK_BUYER][marketplace.PUBLIC] = [];
planPermissions[plan.BULK_BUYER][marketplace.SERVICE] = [];
planPermissions[plan.BULK_BUYER][marketplace.LIFESTYLE] = [];

//permission for whole saller
planPermissions[plan.WHOLESALE_PRICING_GUIDE][marketplace.WHOLESALE] = ["*"];
planPermissions[plan.WHOLESALE_PRICING_GUIDE][marketplace.PUBLIC] = ["*"];
planPermissions[plan.WHOLESALE_PRICING_GUIDE][marketplace.SERVICE] = ["*"];
planPermissions[plan.WHOLESALE_PRICING_GUIDE][marketplace.LIFESTYLE] = ["*"];

module.exports = planPermissions;