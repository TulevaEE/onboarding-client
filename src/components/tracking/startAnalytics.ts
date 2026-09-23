import TagManager from 'react-gtm-module';
import ReactGA from 'react-ga4';
import { installAnalyticsPiiScrubber } from './analyticsPiiScrubber';
import { installPiiClickGuard } from './piiClickGuard';
import { isGiftPage } from './giftPage';

export const startAnalytics = (): void => {
  // The Meta Pixel in public/index.html loads before this bundle and may send its first hit unscrubbed.
  installAnalyticsPiiScrubber();
  installPiiClickGuard();

  // Analytics tools report the URL, and a gift URL carries a token that names a child.
  if (isGiftPage()) {
    return;
  }

  TagManager.initialize({
    gtmId: 'GTM-MRRG43',
  });
  ReactGA.initialize('G-2LNCGK63HR', {
    gaOptions: {
      alwaysSendReferrer: true,
    },
  });
};
