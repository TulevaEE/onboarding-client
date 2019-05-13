import { shim as shimFind } from 'array.prototype.find';
import { enable as enableRejectionTracking } from 'promise/lib/rejection-tracking';
import * as Sentry from '@sentry/browser';

shimFind();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  Sentry.init({
    dsn: 'https://cfcb0c4bb8cb4264942f80ca1eb78c49@sentry.io/146907',
    release: process.env.HEROKU_SLUG_COMMIT,
    environment: process.env.NODE_ENV,
  });

  // Rejection tracking prevents a common issue where React gets into an
  // inconsistent state due to an error, but it gets swallowed by a Promise,
  // and the user has no idea what causes React's erratic future behavior.
  enableRejectionTracking({
    onUnhandled: (id, error) => {
      if (isProduction) {
        Sentry.captureException(error);
      }
    },
  });
}

/* eslint-disable no-extend-native */
if (!String.prototype.startsWith) {
  String.prototype.startsWith = (search, pos) =>
    this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
}
