import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getRememberedMobileIdPerson, getRememberedSmartIdAccount } from '../common/api';
import { RememberedMobileIdPerson, RememberedSmartIdAccount } from '../common/apiModels';
import { forgetThisBrowsersPerson } from './forgetThisBrowsersPerson';

type Known = {
  smartIdAccount?: RememberedSmartIdAccount | null;
  mobileIdPerson?: RememberedMobileIdPerson | null;
};

type Kind = keyof Known;

type RememberedPeople = {
  state: Known;
  ensure: (kind: Kind) => void;
  forget: () => Promise<void>;
};

const LOOKUPS: Record<Kind, () => Promise<Known[Kind]>> = {
  smartIdAccount: getRememberedSmartIdAccount,
  mobileIdPerson: getRememberedMobileIdPerson,
};

export const KnownRememberedPeople = createContext<RememberedPeople | undefined>(undefined);

export const RememberWhoThisBrowserRemembers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<Known>({});
  const asked = useRef<Set<Kind>>(new Set());
  const generation = useRef(0);

  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );

  const ensure = useCallback((kind: Kind) => {
    if (asked.current.has(kind)) {
      return;
    }
    asked.current.add(kind);
    const askedInGeneration = generation.current;
    LOOKUPS[kind]()
      .catch(() => null)
      .then((value) => {
        if (askedInGeneration === generation.current) {
          setState((known) => ({ ...known, [kind]: value }));
        }
      });
  }, []);

  const forget = useCallback(() => {
    generation.current += 1;
    asked.current = new Set<Kind>(['smartIdAccount', 'mobileIdPerson']);
    setState({ smartIdAccount: null, mobileIdPerson: null });
    return forgetThisBrowsersPerson();
  }, []);

  const value = useMemo(() => ({ state, ensure, forget }), [state, ensure, forget]);
  return <KnownRememberedPeople.Provider value={value}>{children}</KnownRememberedPeople.Provider>;
};
