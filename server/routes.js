/**
 * Main application routes
 */

'use strict';

import path from 'path';
import errors from './components/errors';
var controller = require('./api/auth/auth.controller');

export default function(app) {

	/* Server REST API Routes */
	app.post('/auth/admin-token', require('./admin-auth'));
	app.post('/auth/token', require('./auth'));
	app.use('/api/admin-auth', require('./api/admin-auth'));
	app.use('/api/auth', require('./api/auth'));
	app.use('/api/cart', require('./api/cart'));
	app.use('/api/appclients', require('./api/appclients'));
	app.use('/api/admin', require('./api/admin'));
	app.use('/api/order', require('./api/order'));
	app.use('/api/order-history', require('./api/order-history'));
	app.use('/api/product', require('./api/product'));
	app.use('/api/upgrade-plan', require('./api/upgrade-plan'));
	app.use('/api/product-view', require('./api/product-view'));
	app.use('/api/mail', require('./api/mail'));
	app.use('/api/talk', require('./api/talk'));
	app.use('/api/users', require('./api/users'));
	app.use('/api/tickets', require('./api/ticket'));
	app.use('/api/ticket-threads', require('./api/ticket-thread'));
	app.use('/api/vendor', require('./api/vendor'));
	app.use('/api/wishlist', require('./api/wishlist'));
	app.use('/api/gtc-talk', require('./api/gtc-talk'));
	app.use('/api/coupon', require('./api/coupon'));
	app.use('/api/notification', require("./api/notification"));
	app.use('/api/verification', require('./api/verification'));
	app.use('/api/vendor-props', require('./api/vendor-props'));
	app.use('/api/order-checkout', require('./api/order-checkout'));
	app.use('/api/payment', require('./api/payment'));
	app.use('/api/shipping-setting', require('./api/shipping-setting'));
	app.use('/api/reports', require('./api/reports'));
	app.use('/api/export-csv', require('./api/export-csv'));
	app.use('/api/stripe', require('./api/stripe'));
	app.use('/api/paypal', require('./api/paypal'));
	app.use('/api/advertisement', require('./api/advertisement'));
	app.use('/api', require('./api/gtc'));
	app.post('/auth/google', controller.googleLogin);

	/* Handlerbars routes */
	app.use('/', require('./hbs-routes/homePage'));
	app.use('/advertisement', require('./hbs-routes/advertisement'));
	app.use('/cart', require('./hbs-routes/cart'));
	app.use('/directory', require('./hbs-routes/directory'));
	app.use('/wholesale', require('./hbs-routes/wholesale'));
	app.use('/shop', require('./hbs-routes/shop'));
	app.use('/services', require('./hbs-routes/services'));
	app.use('/lifestyle', require('./hbs-routes/lifestyle'));
	app.use('/products', require('./hbs-routes/products'));
	app.use('/refund', require('./hbs-routes/refund'));
	app.use('/geo-locate', require('./hbs-routes/geo-locate'));
	app.use('/vendor', require('./hbs-routes/vendorPages'));
	app.use('/vendor-form', require('./hbs-routes/vendor-form'));
	app.use('/reviews', require('./hbs-routes/reviews'));
	app.use('/upgradeplan', require('./hbs-routes/upgrade-plan'));
	app.use('/messages', require('./hbs-routes/messages'));
	app.use('/notifications', require('./hbs-routes/notifications'));
	app.use('/vendor-notification', require('./hbs-routes/vendor-notification'));
	app.use('/listings', require('./hbs-routes/listings'));
	app.use('/subscription', require('./hbs-routes/subscription'));
	app.use('/terms-and-cond', require('./hbs-routes/terms-and-cond'));
	app.use('/reporting', require('./hbs-routes/reporting'));
	app.use('/my-order', require('./hbs-routes/reporting'));
	app.use('/coupons', require('./hbs-routes/coupons'));
	app.use('/wishlist', require('./hbs-routes/wishlist'));
	app.use('/gtc-talk', require('./hbs-routes/talk'));
	app.use('/search', require('./hbs-routes/search-result'));
	app.use('/login', require('./hbs-routes/login'));
	app.use('/user', require('./hbs-routes/user-profile'));
	app.use('/promote-store', require('./hbs-routes/promote-store'));
	app.use('/order-history', require('./hbs-routes/order-history'));
	app.use('/messages', require('./hbs-routes/messages'));
	app.use('/dashboard-vendor-connect', require('./hbs-routes/vendor-landing'));
	app.use('/order-track', require('./hbs-routes/order-track'));
	app.use('/compare', require('./hbs-routes/compare'));
	app.use('/shipping-settings', require('./hbs-routes/shipping-settings'));
	app.use('/verification', require('./hbs-routes/verification'));
	app.use('/social-profile', require('./hbs-routes/social-profile'));
	app.use('/payment-settings', require('./hbs-routes/payment-settings'));
	app.use('/gtc-mail', require('./hbs-routes/gtc-mail'));
	app.use('/billing-settings', require('./hbs-routes/billing-settings'));
	app.use('/user-verify', require('./hbs-routes/user-verify'));
	app.use('/order-checkout', require('./hbs-routes/checkout'));
	app.use('/user-join', require('./hbs-routes/user-join'));

	app.use('/:vendorType(directories|sellers|wholesalers|retailers|services-providers|subscription-providers)', require('./hbs-routes/vendor-search-result'));
	//should be last route
	app.use('/:marketPlaceType(directory|shop|wholesale|services|lifestyle|products)', require('./hbs-routes/product-view'));
	app.use('/:marketPlaceType(directory|shop|wholesale|services|lifestyle|products)', require('./hbs-routes/search-result'));



	//All other routes 404 page

	app.route('/*').get((req, res) => {
		res.render('404', {
			layout: false
		});
	});


	/*   // All undefined asset or api routes should return a 404
	  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
	    .get(errors[404]);

	  // All other routes should redirect to the index.html
	   app.route('/*')
	    .get((req, res) => {
	      errors[404]
	      //console.log(path.resolve(`${app.get('appPath')}/index.html`))
	      //res.sendFile(path.resolve(`${app.get('appPath')}/index.html`));
	    }); */
}