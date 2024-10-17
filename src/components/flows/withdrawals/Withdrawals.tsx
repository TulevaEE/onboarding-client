import React from 'react';
import { useMe, useWithdrawalsEligibility } from '../../common/apiHooks';
import { WithdrawalsHeader } from './WithdrawalsHeader';
import Loader from '../../common/loader';
import { WithdrawalsSteps } from './WithdrawalsSteps';
import { useWithdrawalsContext, WithdrawalsProvider } from './hooks';
import { WITHDRAWAL_STEPS } from './constants';

export const Withdrawals = () => (
  <WithdrawalsProvider steps={WITHDRAWAL_STEPS}>
    <InnerWithdrawals />
  </WithdrawalsProvider>
);

export const InnerWithdrawals: React.FunctionComponent = () => {
  const { data: user } = useMe();
  const { data: eligibility } = useWithdrawalsEligibility();

  const { currentStep } = useWithdrawalsContext();

  if (!user) {
    return <Loader className="align-middle my-4" />;
  }

  if (!eligibility) {
    return null;
  }

  const CurrentStepComponent = currentStep?.component ?? (() => null);
  return (
    <div className="col-md-8 offset-md-2">
      <WithdrawalsHeader />
      <WithdrawalsSteps />
      <CurrentStepComponent />
    </div>
  );
};
