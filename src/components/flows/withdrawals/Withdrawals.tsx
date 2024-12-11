import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { useMe, useWithdrawalsEligibility } from '../../common/apiHooks';
import { WithdrawalsHeader } from './WithdrawalsHeader';
import Loader from '../../common/loader';
import { WithdrawalsSteps } from './WithdrawalsSteps';
import { useWithdrawalsContext, WithdrawalsProvider } from './hooks';
import { WITHDRAWAL_STEPS } from './constants';
import { getWithdrawalsPath } from './utils';

export const Withdrawals = () => (
  <WithdrawalsProvider steps={WITHDRAWAL_STEPS}>
    <InnerWithdrawals />
  </WithdrawalsProvider>
);

export const InnerWithdrawals: React.FunctionComponent = () => {
  const { data: user } = useMe();
  const { data: eligibility } = useWithdrawalsEligibility();

  const { currentStep } = useWithdrawalsContext();

  if (!user || !eligibility) {
    return <Loader className="align-middle my-4" />;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
  const CurrentStepComponent = currentStep?.component!;
  const currentStepPath = currentStep?.subPath;

  return (
    <div className="col-lg-10 offset-lg-1 col-xl-8 offset-xl-2">
      {currentStep?.type !== 'DONE' && (
        <>
          <WithdrawalsHeader />
          <WithdrawalsSteps />
        </>
      )}
      <Switch>
        <Route
          path={getWithdrawalsPath(currentStepPath as string)}
          component={CurrentStepComponent}
        />
        <Redirect exact path="/withdrawals" to={getWithdrawalsPath(currentStepPath as string)} />
      </Switch>
    </div>
  );
};
