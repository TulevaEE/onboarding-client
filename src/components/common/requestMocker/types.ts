import { WithdrawalsEligibilityProfile } from './profiles/withdrawalsEligibility';

export type MockModeConfiguration = {
  withdrawalsEligibility: WithdrawalsEligibilityProfile | null;
};

export type MockModeEndpoint = keyof MockModeConfiguration;
