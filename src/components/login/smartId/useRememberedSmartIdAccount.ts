import { useCallback, useEffect, useState } from 'react';

import { forgetRememberedSmartIdAccount, getRememberedSmartIdAccount } from '../../common/api';
import { RememberedSmartIdAccount } from '../../common/apiModels';
import { isMobileDevice } from '../../common/isMobileDevice';

interface RememberedSmartIdAccountState {
  account: RememberedSmartIdAccount | null;
  loading: boolean;
}

export function useRememberedSmartIdAccount(): RememberedSmartIdAccountState & {
  forget: () => Promise<void>;
} {
  const pushLoginAvailable = !isMobileDevice();
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
      forgetRememberedSmartIdAccount()
        .catch(() => undefined)
        .then(() => setState({ account: null, loading: false })),
    [],
  );

  return { ...state, forget };
}
