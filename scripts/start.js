// This script is used to serve the built files in production.
// Would be preferrable to replace with apache.

const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('/.well-known/acme-challenge/W57jQBxZBGjcJeNwZ7xdJ0I955AMgUNnOSuEUA3Jkos', (request, response) =>
  response.send('W57jQBxZBGjcJeNwZ7xdJ0I955AMgUNnOSuEUA3Jkos.WmtYasmHj0-9Rw5MJjwC0wMmsYFHPXTJMhCCgqBxzTo'));

app.get('*', (request, response) =>
  response.sendFile(path.join(__dirname, '..', 'build', 'index.html')));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Static files server running on ${port}`)); // eslint-disable-line
