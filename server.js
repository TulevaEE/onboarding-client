// This script is used to serve the built files in production and proxy api requests to the service.
// Would be preferrable to replace with apache.

const express = require('express');
const proxy = require('express-http-proxy');
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
app.use(express.static(path.join(__dirname, 'build')));
app.use('/api', proxy('https://onboarding-service.tuleva.ee'));

app.get(
  '/.well-known/acme-challenge/OdrAnFjU3FGu8CH_YxF8vhpiOD3PGNH19TK68v7DkYY',
  (request, response) =>
    response.send(
      'OdrAnFjU3FGu8CH_YxF8vhpiOD3PGNH19TK68v7DkYY.EMEBBxvSam3n_ien1J0z4dXeTuc2JuR3HqfAP6teLjE',
    ),
);

app.get('*', (request, response) => response.sendFile(path.join(__dirname, 'build', 'index.html')));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Static server running on ${port}`)); // eslint-disable-line
