import { useContext, useEffect } from 'react';

import { RememberedMobileIdPerson } from '../../common/apiModels';
import { KnownRememberedPeople } from '../rememberedPeople';

export function useRememberedMobileIdPerson(): {
  person: RememberedMobileIdPerson | null;
  loading: boolean;
  forget: () => Promise<void>;
} {
  const people = useContext(KnownRememberedPeople);
  if (!people) {
    throw new Error('useRememberedMobileIdPerson needs RememberWhoThisBrowserRemembers');
  }
  const { state, ensure, forget } = people;

  useEffect(() => {
    ensure('mobileIdPerson');
  }, [ensure]);

  return {
    person: state.mobileIdPerson ?? null,
    loading: state.mobileIdPerson === undefined,
    forget,
  };
}
