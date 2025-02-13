import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import {
  useConversion,
  useFundPensionStatus,
  useMe,
  useWithdrawalsEligibility,
} from '../../common/apiHooks';
import { WithdrawalsHeader } from './WithdrawalsHeader';
import { Shimmer } from '../../common/shimmer/Shimmer';
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
    return (
      <div className="d-flex flex-column align-items-center">
        <div style={{ width: '336px' }} className="mb-4">
          <Shimmer height={36} />
        </div>
        <div style={{ width: '540px' }} className="mb-3">
          <Shimmer height={60} />
        </div>
        <div style={{ width: '540px' }}>
          <Shimmer height={60} />
        </div>
        <div style={{ width: '540px' }} className="my-5">
          <Shimmer height={32} />
        </div>
        <div className="col-12 col-md-11 col-lg-8 mx-auto">
          <div className="card p-4 d-flex flex-column gap-2">
            <Shimmer height={32} />
            <Shimmer height={32} />
            <Shimmer height={32} />
          </div>
          <div className="card p-4 d-flex flex-column gap-2 mt-3">
            <Shimmer height={32} />
            <Shimmer height={32} />
            <Shimmer height={32} />
          </div>
          <div className="card p-4 d-flex flex-column gap-2 mt-3">
            <Shimmer height={32} />
            <Shimmer height={32} />
            <Shimmer height={32} />
          </div>
        </div>
      </div>
    );
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
