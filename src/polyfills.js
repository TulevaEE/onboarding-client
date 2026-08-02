import { shim as shimFind } from 'array.prototype.find';
import { enable as enableRejectionTracking } from 'promise/lib/rejection-tracking';
import * as Sentry from '@sentry/browser';
import { THIRD_PARTY_ERROR_MESSAGES, THIRD_PARTY_SCRIPT_URLS } from './sentryIgnoreRules';

shimFind();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  Sentry.init({
    dsn: 'https://cfcb0c4bb8cb4264942f80ca1eb78c49@sentry.io/146907',
    environment: process.env.NODE_ENV,
    sampleRate: 1.0,
    ignoreErrors: THIRD_PARTY_ERROR_MESSAGES,
    denyUrls: THIRD_PARTY_SCRIPT_URLS,
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
