import { History } from 'history';
import TagManager from 'react-gtm-module';
import ReactGA from 'react-ga4';
import { installAnalyticsPiiScrubber } from './analyticsPiiScrubber';
import { installPiiClickGuard } from './piiClickGuard';
import { isGiftPage } from './giftPage';
import { smartIdCallbackPath } from '../login/constants';

const installPersonalDataProtection = (): boolean => {
  try {
    // The Meta Pixel in public/index.html loads before this bundle and may send its first hit unscrubbed.
    installAnalyticsPiiScrubber();
    installPiiClickGuard();
    return true;
  } catch (error) {
    return false;
  }
};

// Analytics must never stop the app from starting, and never run without the personal data protection.
const startTagManagerAndGa = (): void => {
  try {
    TagManager.initialize({
      gtmId: 'GTM-MRRG43',
    });
    ReactGA.initialize('G-2LNCGK63HR', {
      gaOptions: {
        alwaysSendReferrer: true,
      },
      gtagOptions: {
        send_page_view: false,
      },
    });
  } catch (error) {
    // the app keeps working without analytics
  }
};

const isDevelopmentServer = (): boolean => process.env.NODE_ENV === 'development';

const isSmartIdCallbackPage = (pathname: string): boolean =>
  pathname.startsWith(smartIdCallbackPath);

const startTagManagerAndGaOnceAwayFromSmartIdCallback = (history: History): void => {
  const stopListening = history.listen(({ pathname }) => {
    if (!isSmartIdCallbackPage(pathname)) {
      stopListening();
      startTagManagerAndGa();
    }
  });
};

export const startAnalytics = (history: History): void => {
  const isProtected = installPersonalDataProtection();

  // Analytics tools report the URL, and a gift URL carries a token that names a child.
  if (!isProtected || isGiftPage() || isDevelopmentServer()) {
    return;
  }

  if (isSmartIdCallbackPage(window.location.pathname)) {
    startTagManagerAndGaOnceAwayFromSmartIdCallback(history);
    return;
  }

  startTagManagerAndGa();
};
