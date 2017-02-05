// This script is used to serve the built files in production.
// Would be preferrable to replace with apache.

const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'build')));

app.use(function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    return next();
});

app.get('*', (request, response) =>
  response.sendFile(path.join(__dirname, '..', 'build', 'index.html')));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Static files server running on ${port}`)); // eslint-disable-line
