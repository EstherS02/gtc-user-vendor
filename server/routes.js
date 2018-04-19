/**
 * Main application routes
 */

'use strict';

import path from 'path';
import errors from './components/errors';

export default function(app) {
  // Insert routes below
  app.post('/auth/admin-token', require('./admin-auth'));
  app.post('/auth/token', require('./auth'));
  app.use('/api/admin-auth', require('./api/admin-auth'));
  app.use('/api/auth', require('./api/auth'));
  
  app.use('/api/appclients', require('./api/appclients'));
  app.use('/api/admin', require('./api/admin'));
  app.use('/api/users', require('./api/users'));
  app.use('/api', require('./api/gtc'));
  app.use('/api/product',require('./api/products'))
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get((req, res) => {
      res.sendFile(path.resolve(`${app.get('appPath')}/index.html`));
    });
}