import { useCallback, useState } from 'react';
import { useMe, useSourceFunds } from '../../common/apiHooks';
import { SourceFund, User } from '../../common/apiModels';
import { hasNudgeBeenDismissed, hasOtherServiceEntry, rememberNudgeDismissed } from './suppression';

export function useSecondPillarNudge(): { show: boolean; dismiss: () => void } {
  const { data: user } = useMe();
  const { data: sourceFunds } = useSourceFunds();
  const [dismissed, setDismissed] = useState(hasNudgeBeenDismissed());

  const dismiss = useCallback(() => {
    rememberNudgeDismissed();
    setDismissed(true);
  }, []);

  const show =
    !dismissed && !hasOtherServiceEntry() && qualifiesForSecondPillarNudge(user, sourceFunds);

  return { show, dismiss };
}

export function qualifiesForSecondPillarNudge(user?: User, sourceFunds?: SourceFund[]): boolean {
  if (!user || !sourceFunds || !user.secondPillarActive) {
    return false;
  }

  const { current, pending } = user.secondPillarPaymentRates;
  const isAtTwoPercent = current === 2 && (pending === null || pending <= 2);
  if (!isAtTwoPercent) {
    return false;
  }

  const activeSecondPillarFund = sourceFunds.find((fund) => fund.activeFund && fund.pillar === 2);
  return activeSecondPillarFund?.fundManager?.name === 'Tuleva';
}
