import { useContext, useEffect, useState } from 'react';

import { isMobileIdNumberRemembered } from '../../common/api';
import { isValidPersonalCode } from '../../common/personalCode';
import { KnownMobileIdNumbers } from './knownMobileIdNumbers';

const LOOKUP_DELAY_MILLIS = 300;

export function useRememberedMobileIdNumber(
  personalCode: string,
  phoneNumberNeeded: boolean,
): boolean {
  const knownNumbers = useContext(KnownMobileIdNumbers);
  const [rememberedFor, setRememberedFor] = useState<string | null>(() =>
    knownNumbers?.get(personalCode) ? personalCode : null,
  );
  const worthAsking = !phoneNumberNeeded && isValidPersonalCode(personalCode);

  useEffect(() => {
    if (!worthAsking) {
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      isMobileIdNumberRemembered(personalCode, controller.signal)
        .catch(() => false)
        .then((remembered) => {
          if (!controller.signal.aborted) {
            knownNumbers?.set(personalCode, remembered);
            setRememberedFor(remembered ? personalCode : null);
          }
        });
    }, LOOKUP_DELAY_MILLIS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [personalCode, worthAsking, knownNumbers]);

  return worthAsking && rememberedFor === personalCode;
}
