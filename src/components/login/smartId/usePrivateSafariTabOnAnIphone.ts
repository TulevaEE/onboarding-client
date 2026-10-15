import { useEffect, useState } from 'react';

import { inAPrivateSafariTab } from './privateSafariTab';

const SAFARI_ON_AN_IPHONE = /iPhone.*Version\/[\d.]+ Mobile\/\w+ Safari\/[\d.]+$/;

export function usePrivateSafariTabOnAnIphone(): boolean {
  const [privateTab, setPrivateTab] = useState(false);

  useEffect(() => {
    if (!SAFARI_ON_AN_IPHONE.test(navigator.userAgent)) {
      return undefined;
    }
    let stillShown = true;
    inAPrivateSafariTab().then((inAPrivateTab) => {
      if (stillShown) {
        setPrivateTab(inAPrivateTab);
      }
    });
    return () => {
      stillShown = false;
    };
  }, []);

  return privateTab;
}
