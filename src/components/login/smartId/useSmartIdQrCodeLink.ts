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
    let refreshedAt = startedAt;
    let stopped = false;

    const refresh = async () => {
      if (Date.now() - startedAt >= SESSION_LIFETIME_MILLIS) {
        stopped = true;
        clearInterval(interval);
        setDeviceLink(null);
        setExpired(true);
        return;
      }
      if (Date.now() - refreshedAt >= MAX_LINK_AGE_MILLIS) {
        setDeviceLink(null);
      }
      try {
        const qrCode = await getSmartIdQrCodeLink();
        if (stopped) {
          return;
        }
        refreshedAt = Date.now();
        setDeviceLink(qrCode.deviceLink);
      } catch (error) {
        setDeviceLink((staleLink) =>
          Date.now() - refreshedAt >= MAX_LINK_AGE_MILLIS ? null : staleLink,
        );
      }
    };

    const interval = setInterval(refresh, REFRESH_INTERVAL_MILLIS);
    refresh();

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, []);

  return { deviceLink, expired };
}
