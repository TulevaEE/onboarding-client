import { Redirect } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { useSavingsFundOnboardingStatus } from './apiHooks';

export const SavingsFundOnboardingGatekeep = ({ children }: PropsWithChildren<unknown>) => {
  const { data: onboardingStatus, isLoading, isFetching } = useSavingsFundOnboardingStatus();

  if (onboardingStatus?.status === 'COMPLETED') {
    return <>{children}</>;
  }

  // The status is keyed by the acting party, so a role switch lands on a fresh
  // (empty, loading) cache entry rather than the previous role's value. Wait for
  // that fetch instead of bouncing to the chooser while it is in flight.
  if (isLoading || isFetching) {
    return null;
  }

  return <Redirect to="/savings-fund/onboarding" />;
};
