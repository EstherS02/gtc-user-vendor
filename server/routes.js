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
  app.use('/api/auth/twitter', require('./api/social-login-auth'));
  app.use('/api/admin-auth', require('./api/admin-auth'));
  app.use('/api/auth', require('./api/auth'));

  app.use('/api/cart', require('./api/cart'));
  app.use('/api/appclients', require('./api/appclients'));
  app.use('/api/admin', require('./api/admin'));
  app.use('/api/product', require('./api/product'));
  app.use('/api/users', require('./api/users'));
  app.use('/api/tickets', require('./api/ticket'));
  app.use('/api/ticket-threads', require('./api/ticket-thread'));
  app.use('/api/vendor', require('./api/vendor'));
  app.use('/api/wishlist', require('./api/wishlist'));
  app.use('/api/gtc-talk', require('./api/gtc-talk'));
  app.use('/api', require('./api/gtc'));
  app.post('/auth/google', controller.googleLogin);
  app.post('/auth/fb', controller.facebookLogin);
  app.post('/auth/linkedin', controller.linkedInLogin);
  app.post('/auth/twitter', controller.twitterLogin);


  /* Handlerbars routes */
  app.use('/', require('./hbs-routes/homePage'));
  app.use('/cart', require('./hbs-routes/cart'));
  app.use('/directory', require('./hbs-routes/directory'));
  app.use('/wholesale', require('./hbs-routes/wholesale'));
  app.use('/shop', require('./hbs-routes/shop'));
  app.use('/services', require('./hbs-routes/services'));
  app.use('/lifestyle', require('./hbs-routes/lifestyle'));
  app.use('/products', require('./hbs-routes/products'));
  app.use('/vendor', require('./hbs-routes/vendor'));
  app.use('/reviews', require('./hbs-routes/reviews'));
  app.use('/notifications', require('./hbs-routes/notifications'));
  app.use('/listings', require('./hbs-routes/listings'));
  app.use('/coupons', require('./hbs-routes/coupons'));
  app.use('/wishlist', require('./hbs-routes/wishlist'));
  app.use('/gtc-talk', require('./hbs-routes/talk'));
  app.use('/search', require('./hbs-routes/search-result'));
  app.use('/add-product', require('./hbs-routes/add-product'));
  app.use('/login', require('./hbs-routes/login'));
  app.use('/user-profile', require('./hbs-routes/user-profile'));
  app.use('/:marketPlaceType', require('./hbs-routes/product-view'));
  app.use('/promote-store', require('./hbs-routes/promote-store'));
  app.use('/vendor-about', require('./hbs-routes/vendor-about'));
  app.use('/vendor-support', require('./hbs-routes/vendor-support'));
  app.use('/vendor-shop', require('./hbs-routes/vendor-shop'));
  app.use('/vendor-services', require('./hbs-routes/vendor-services'));
  app.use('/vendor-wholesale', require('./hbs-routes/vendor-wholesale'));
  app.use('/order-history', require('./hbs-routes/order-history'));
  app.use('/reporting', require('./hbs-routes/reporting'));
  app.use('/shipping-settings', require('./hbs-routes/shipping-settings'));
  app.use('/verification', require('./hbs-routes/verification'));
  app.use('/social-profile', require('./hbs-routes/social-profile'));
  app.use('/payment-settings', require('./hbs-routes/payment-settings'));
  app.use('/gtc-mail', require('./hbs-routes/gtc-mail'));
  app.use('/billing-settings', require('./hbs-routes/billing-settings'));

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