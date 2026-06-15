import { Redirect } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { useSavingsFundOnboardingStatus } from './apiHooks';

export const SavingsFundOnboardingGatekeep = ({ children }: PropsWithChildren<unknown>) => {
  const { data: onboardingStatus, isLoading, isFetching } = useSavingsFundOnboardingStatus();

  if (onboardingStatus?.status === 'COMPLETED') {
    return <>{children}</>;
  }

  // A role switch invalidates the cached status but leaves the stale value in
  // place — never bounce the user on it while a fresh answer is on its way.
  if (isLoading || isFetching) {
    return null;
  }

  return <Redirect to="/savings-fund/onboarding" />;
};
