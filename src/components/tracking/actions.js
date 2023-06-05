import ReactGA from 'react-ga4';
import { LOCATION_CHANGE } from 'connected-react-router';

export function trackEvent(type, data) {
  if (process.env.NODE_ENV === 'production') {
    if (type === LOCATION_CHANGE) {
      ReactGA.send({ hitType: 'pageview', page: data.path });
      ReactGA.event({
        category: 'application',
        action: type,
        label: data.path,
      });
    } else {
      ReactGA.event({
        category: 'application',
        action: type,
      });
    }
  }
}
