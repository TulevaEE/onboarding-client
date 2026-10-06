import { useCallback, useEffect, useState } from 'react';

import { getRememberedMobileIdPerson } from '../../common/api';
import { forgetThisBrowsersPerson } from '../forgetThisBrowsersPerson';
import { RememberedMobileIdPerson } from '../../common/apiModels';

interface RememberedMobileIdPersonState {
  person: RememberedMobileIdPerson | null;
  loading: boolean;
}

export function useRememberedMobileIdPerson(): RememberedMobileIdPersonState & {
  forget: () => Promise<void>;
} {
  const [state, setState] = useState<RememberedMobileIdPersonState>({
    person: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    getRememberedMobileIdPerson()
      .catch(() => null)
      .then((person) => {
        if (!cancelled) {
          setState({ person, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const forget = useCallback(
    () =>
      forgetThisBrowsersPerson()
        .catch(() => undefined)
        .then(() => setState({ person: null, loading: false })),
    [],
  );

  return { ...state, forget };
}
