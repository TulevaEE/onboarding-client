import { useEffect, useState } from 'react';

const LINK_OPENED_AS_A_WEB_PAGE = 'smartIdLinkOpenedAsAWebPage';

let departedForTheSmartIdLink = false;

export const departForTheSmartIdLink = (): void => {
  departedForTheSmartIdLink = true;
};

const linkOpenedAsAWebPage = (): string | null => {
  try {
    return sessionStorage.getItem(LINK_OPENED_AS_A_WEB_PAGE);
  } catch (storageUnavailable) {
    return null;
  }
};

const rememberTheLinkOpenedAsAWebPage = (web2AppLink: string): boolean => {
  try {
    sessionStorage.setItem(LINK_OPENED_AS_A_WEB_PAGE, web2AppLink);
    return true;
  } catch (storageUnavailable) {
    return false;
  }
};

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
