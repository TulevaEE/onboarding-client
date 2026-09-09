import { useEffect, useState } from 'react';

import { getSmartIdQrCodeLink } from '../../common/api';

const REFRESH_INTERVAL_MILLIS = 1000;
const MAX_LINK_AGE_MILLIS = 3000;
const SESSION_LIFETIME_MILLIS = 60000;

export function useSmartIdQrCodeLink(): { deviceLink: string | null; expired: boolean } {
  const [deviceLink, setDeviceLink] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    let refreshInterval: ReturnType<typeof setInterval>;
    let stalenessTimeout: ReturnType<typeof setTimeout>;
    let stopped = false;
    let latestRequest = 0;
    let latestAcceptedRequest = 0;

    const stop = () => {
      stopped = true;
      clearInterval(refreshInterval);
      clearTimeout(stalenessTimeout);
    };

    const hideWhenStale = () => {
      clearTimeout(stalenessTimeout);
      stalenessTimeout = setTimeout(() => setDeviceLink(null), MAX_LINK_AGE_MILLIS);
    };

    const refresh = async () => {
      if (Date.now() - startedAt >= SESSION_LIFETIME_MILLIS) {
        stop();
        setDeviceLink(null);
        setExpired(true);
        return;
      }
      latestRequest += 1;
      const request = latestRequest;
      const qrCode = await getSmartIdQrCodeLink().catch(() => null);
      if (stopped || !qrCode || request <= latestAcceptedRequest) {
        return;
      }
      latestAcceptedRequest = request;
      setDeviceLink(qrCode.deviceLink);
      hideWhenStale();
    };

    refreshInterval = setInterval(refresh, REFRESH_INTERVAL_MILLIS);
    refresh();

    return stop;
  }, []);

  return { deviceLink, expired };
}
