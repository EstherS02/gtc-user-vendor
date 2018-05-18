/**
 * Main application routes
 */

'use strict';

import path from 'path';
import errors from './components/errors';

export default function(app) {
  
  /* Server REST API Routes */
  app.post('/auth/admin-token', require('./admin-auth'));
  app.post('/auth/token', require('./auth'));
  app.use('/api/auth/twitter', require('./api/social-login-auth'));
  app.use('/api/admin-auth', require('./api/admin-auth'));
  app.use('/api/auth', require('./api/auth'));

  app.use('/api/appclients', require('./api/appclients'));
  app.use('/api/admin', require('./api/admin'));
  app.use('/api/product', require('./api/product'));
  app.use('/api/users', require('./api/users'));
  app.use('/api/tickets', require('./api/ticket'));
  app.use('/api/ticket-threads', require('./api/ticket-thread'));
  app.use('/api/vendor', require('./api/vendor'));
  app.use('/api', require('./api/gtc'));


  /* Handlerbars routes */
  app.use('/', require('./hbs-routes/homePage'));
  app.use('/checkout', require('./hbs-routes/checkout'));
  app.use('/service', require('./hbs-routes/service'));
  app.use('/vendor', require('./hbs-routes/vendor'));
  app.use('/edit-listings', require('./hbs-routes/edit-listings'));
  app.use('/reviews', require('./hbs-routes/reviews'));
  app.use('/notifications', require('./hbs-routes/notifications'));


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