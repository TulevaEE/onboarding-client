import { useContext, useEffect } from 'react';

import { RememberedSmartIdAccount } from '../../common/apiModels';
import { deviceClass } from '../../common/deviceClass';
import { KnownRememberedPeople } from '../rememberedPeople';

export function useRememberedSmartIdAccount(): {
  account: RememberedSmartIdAccount | null;
  loading: boolean;
  pushLoginAvailable: boolean;
  forget: () => Promise<void>;
} {
  const pushLoginAvailable = deviceClass() === 'computer';
  const people = useContext(KnownRememberedPeople);
  if (!people) {
    throw new Error('useRememberedSmartIdAccount needs RememberWhoThisBrowserRemembers');
  }
  const { state, ensure, forget } = people;

  useEffect(() => {
    if (pushLoginAvailable) {
      ensure('smartIdAccount');
    }
  }, [pushLoginAvailable, ensure]);

  return {
    account: state.smartIdAccount ?? null,
    loading: pushLoginAvailable && state.smartIdAccount === undefined,
    pushLoginAvailable,
    forget,
  };
}
