import { useEffect, useRef, useState } from 'react';

import { getSmartIdQrCodeLink } from '../../common/api';
import { getPendingSmartIdStartedAt } from '../actions';

const REFRESH_INTERVAL_MILLIS = 1000;
const MAX_LINK_AGE_MILLIS = 3000;
const SESSION_LIFETIME_MILLIS = 60000;

const isRefusedByBackend = (error: unknown): boolean => {
  const status = (error as { status?: unknown })?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
};

const pageInView = () => document.visibilityState === 'visible';

export function useSmartIdQrCodeLink(renewSilently: () => boolean): {
  deviceLink: string | null;
  expired: boolean;
} {
  const [deviceLink, setDeviceLink] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const latestRenewSilently = useRef(renewSilently);
  latestRenewSilently.current = renewSilently;

  useEffect(() => {
    const startedAt = getPendingSmartIdStartedAt() ?? Date.now();
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

    const expire = () => {
      stop();
      setDeviceLink(null);
      setExpired(true);
    };

    const outlive = () => {
      stop();
      setDeviceLink(null);
      const renewed = pageInView() && latestRenewSilently.current();
      if (!renewed) {
        setExpired(true);
      }
    };

    const refresh = async () => {
      if (Date.now() - startedAt >= SESSION_LIFETIME_MILLIS) {
        outlive();
        return;
      }
      latestRequest += 1;
      const request = latestRequest;
      const qrCode = await getSmartIdQrCodeLink().catch((error) => {
        if (!stopped && isRefusedByBackend(error)) {
          expire();
        }
        return null;
      });
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
