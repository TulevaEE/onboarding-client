import { useCallback, useEffect, useState } from 'react';

import { getRememberedSmartIdAccount } from '../../common/api';
import { forgetThisBrowsersPerson } from '../forgetThisBrowsersPerson';
import { RememberedSmartIdAccount } from '../../common/apiModels';
import { deviceClass } from '../../common/deviceClass';

interface RememberedSmartIdAccountState {
  account: RememberedSmartIdAccount | null;
  loading: boolean;
}

export function useRememberedSmartIdAccount(): RememberedSmartIdAccountState & {
  pushLoginAvailable: boolean;
  forget: () => Promise<void>;
} {
  const pushLoginAvailable = deviceClass() === 'computer';
  const [state, setState] = useState<RememberedSmartIdAccountState>({
    account: null,
    loading: pushLoginAvailable,
  });

  useEffect(() => {
    if (!pushLoginAvailable) {
      return undefined;
    }
    let cancelled = false;
    getRememberedSmartIdAccount()
      .catch(() => null)
      .then((account) => {
        if (!cancelled) {
          setState({ account, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pushLoginAvailable]);

  const forget = useCallback(
    () =>
      forgetThisBrowsersPerson()
        .catch(() => undefined)
        .then(() => setState({ account: null, loading: false })),
    [],
  );

  return { ...state, pushLoginAvailable, forget };
}
