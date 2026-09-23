import ReactGA from 'react-ga4';
import { LOCATION_CHANGE } from 'connected-react-router';
import { withoutGiftToken } from '../../sentryEventFilter';
import { redactPii } from './piiPatterns';

const reportedPath = (path) => withoutGiftToken(redactPii(path));

export function trackEvent(type, data) {
  if (process.env.NODE_ENV === 'production') {
    if (type === LOCATION_CHANGE) {
      const page = reportedPath(data.path);
      ReactGA.send({ hitType: 'pageview', page });
      ReactGA.event({
        category: 'application',
        action: type,
        label: page,
      });
    } else {
      ReactGA.event({
        category: 'application',
        action: type,
      });
    }
  }
}
