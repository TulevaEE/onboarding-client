var Raven = require('raven-js');

if (process.env.NODE_ENV === 'production') {
  Raven
    .config('https://cfcb0c4bb8cb4264942f80ca1eb78c49@sentry.io/146907', {
      release: process.env.HEROKU_SLUG_COMMIT,
      environment: process.env.NODE_ENV,
    })
    .install();
}

if (typeof Promise === 'undefined') {
  // Rejection tracking prevents a common issue where React gets into an
  // inconsistent state due to an error, but it gets swallowed by a Promise,
  // and the user has no idea what causes React's erratic future behavior.
  require('promise/lib/rejection-tracking').enable({
    onUnhandled: function(id, error) {
      if (process.env.NODE_ENV === 'production') {
        Raven.captureException(error);
      }
    }
  });
  window.Promise = require('promise/lib/es6-extensions.js');
}

// fetch() polyfill for making API calls.
require('whatwg-fetch');

// Object.assign() is commonly used with React.
// It will use the native implementation if it's present and isn't buggy.
Object.assign = require('object-assign');
