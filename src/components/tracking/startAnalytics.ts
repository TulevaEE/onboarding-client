import TagManager from 'react-gtm-module';
import ReactGA from 'react-ga4';
import { installAnalyticsPiiScrubber } from './analyticsPiiScrubber';
import { installPiiClickGuard } from './piiClickGuard';
import { isGiftPage } from './giftPage';

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
export const startAnalytics = (): void => {
  const isProtected = installPersonalDataProtection();

  // Analytics tools report the URL, and a gift URL carries a token that names a child.
  if (!isProtected || isGiftPage()) {
    return;
  }

  try {
    TagManager.initialize({
      gtmId: 'GTM-MRRG43',
    });
    ReactGA.initialize('G-2LNCGK63HR', {
      gaOptions: {
        alwaysSendReferrer: true,
      },
    });
  } catch (error) {
    // the app keeps working without analytics
  }
};
