import { shim as shimFind } from 'array.prototype.find';
import Raven from 'raven-js';
import { enable as enableRejectionTracking } from 'promise/lib/rejection-tracking';

shimFind();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  Raven.config('https://cfcb0c4bb8cb4264942f80ca1eb78c49@sentry.io/146907', {
    release: process.env.HEROKU_SLUG_COMMIT,
    environment: process.env.NODE_ENV,
  }).install();

  // Rejection tracking prevents a common issue where React gets into an
  // inconsistent state due to an error, but it gets swallowed by a Promise,
  // and the user has no idea what causes React's erratic future behavior.
  enableRejectionTracking({
    onUnhandled: (id, error) => {
      if (isProduction) {
        Raven.captureException(error);
      }
    },
  });
}

/* eslint-disable no-extend-native */
if (!String.prototype.startsWith) {
  String.prototype.startsWith = (search, pos) =>
    this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
}
