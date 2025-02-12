import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import {
  useConversion,
  useFundPensionStatus,
  useMe,
  useWithdrawalsEligibility,
} from '../../common/apiHooks';
import { WithdrawalsHeader } from './WithdrawalsHeader';
import { Loader } from '../../common/loader/Loader';
import { WithdrawalsSteps } from './WithdrawalsSteps';
import { useWithdrawalsContext, WithdrawalsProvider } from './hooks';
import { WITHDRAWAL_STEPS } from './constants';
import { canAccessWithdrawals, getWithdrawalsPath } from './utils';

export const Withdrawals = () => (
  <WithdrawalsProvider steps={WITHDRAWAL_STEPS}>
    <InnerWithdrawals />
  </WithdrawalsProvider>
);

export const InnerWithdrawals: React.FunctionComponent = () => {
  const { data: user } = useMe();
  const { data: conversion } = useConversion();
  const { data: eligibility } = useWithdrawalsEligibility();
  const { data: fundPensionStatus } = useFundPensionStatus();

  const { currentStep } = useWithdrawalsContext();

  if (!user || !eligibility || !conversion || !fundPensionStatus) {
    return <Loader className="align-middle my-4" />;
  }

  if (!canAccessWithdrawals(conversion, fundPensionStatus)) {
    return <Redirect exact to="/" />;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
  const CurrentStepComponent = currentStep?.component!;
  const currentStepPath = currentStep?.subPath;

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
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
