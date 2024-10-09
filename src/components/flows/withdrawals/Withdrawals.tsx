import React, { useState } from 'react';
import { useMe, useWithdrawalsEligibility } from '../../common/apiHooks';
import { WithdrawalsHeader } from './WithdrawalsHeader';
import Loader from '../../common/loader';
import { WithdrawalsSteps } from './WithdrawalsSteps';
import { withdrawalSteps, WithdrawalStepType } from './constants';

export const Withdrawals: React.FunctionComponent = () => {
  const { data: user } = useMe();
  const { data: eligibility } = useWithdrawalsEligibility();

  const [currentStepType, setCurrentStepType] = useState<WithdrawalStepType>('WITHDRAWAL_SIZE');

  const currentStep = withdrawalSteps.find((step) => step.type === currentStepType);
  const currentStepNumber = withdrawalSteps.findIndex((step) => step.type === currentStepType);

  if (!user) {
    return <Loader className="align-middle my-4" label="Loading ..." />;
  }

  if (!eligibility) {
    return null;
  }

  const CurrentStepComponent = currentStep?.component ?? (() => null);

  return (
    <div className="col-md-8 offset-md-2">
      <WithdrawalsHeader />
      <WithdrawalsSteps currentStep={currentStepNumber} />
      <CurrentStepComponent />
    </div>
  );
};
