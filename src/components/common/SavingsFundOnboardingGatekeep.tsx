import { Redirect } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { useSavingsFundOnboardingStatus } from './apiHooks';

export const SavingsFundOnboardingGatekeep = ({ children }: PropsWithChildren<unknown>) => {
  const { data: onboardingStatus, isLoading } = useSavingsFundOnboardingStatus();

  if (isLoading) {
    return null;
  }

  if (onboardingStatus?.status !== 'COMPLETED') {
    return <Redirect to="/savings-fund/onboarding" />;
  }

  return <>{children}</>;
};
