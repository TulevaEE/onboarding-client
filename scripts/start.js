// This script is used to serve the built files in production.
// Would be preferrable to replace with apache.

const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();

function forceHttps(request, response, next) {
  if (request.headers['x-forwarded-proto'] !== 'https') {
    return response.redirect(301, `https://${request.get('host')}${request.url}`);
  }
  return next();
}

app.use(compression());
app.use(forceHttps);
app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('/.well-known/acme-challenge/KmkeIleRyIRV7VQCFLK-L6EjRSwW_WZweA9DRQy21-E', (request, response) =>
  response.send('KmkeIleRyIRV7VQCFLK-L6EjRSwW_WZweA9DRQy21-E.EMEBBxvSam3n_ien1J0z4dXeTuc2JuR3HqfAP6teLjE'));

app.get('*', (request, response) =>
  response.sendFile(path.join(__dirname, '..', 'build', 'index.html')));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Static files server running on ${port}`)); // eslint-disable-line
