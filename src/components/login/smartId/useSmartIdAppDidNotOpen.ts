import { useEffect, useState } from 'react';

import { withSessionStorage } from '../../common/siteStorage';

const LINK_OPENED_AS_A_WEB_PAGE = 'smartIdLinkOpenedAsAWebPage';

let departedForTheSmartIdLink = false;

export const departForTheSmartIdLink = (): void => {
  departedForTheSmartIdLink = true;
};

const linkOpenedAsAWebPage = (): string | null =>
  withSessionStorage((storage) => storage.getItem(LINK_OPENED_AS_A_WEB_PAGE), null);

const rememberTheLinkOpenedAsAWebPage = (web2AppLink: string): void =>
  withSessionStorage(
    (storage) => storage.setItem(LINK_OPENED_AS_A_WEB_PAGE, web2AppLink),
    undefined,
  );

export function useSmartIdAppDidNotOpen(web2AppLink: string): boolean {
  const [didNotOpen, setDidNotOpen] = useState(() => linkOpenedAsAWebPage() === web2AppLink);

  useEffect(() => {
    let leftAsAWebPage = false;
    const onPageHide = () => {
      if (departedForTheSmartIdLink) {
        leftAsAWebPage = true;
        rememberTheLinkOpenedAsAWebPage(web2AppLink);
      }
    };
    const onPageShow = () => {
      if (leftAsAWebPage || linkOpenedAsAWebPage() === web2AppLink) {
        setDidNotOpen(true);
      }
    };
    const onBackInViewWithoutLeaving = () => {
      if (document.visibilityState === 'visible') {
        departedForTheSmartIdLink = false;
      }
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onBackInViewWithoutLeaving);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onBackInViewWithoutLeaving);
      departedForTheSmartIdLink = false;
    };
  }, [web2AppLink]);

  return didNotOpen;
}
