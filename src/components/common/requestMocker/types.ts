import { UserMockProfile } from './profiles/user';
import { WithdrawalsEligibilityProfile } from './profiles/withdrawalsEligibility';

export type MockModeConfiguration = {
  withdrawalsEligibility: WithdrawalsEligibilityProfile | null;
  user: UserMockProfile | null;
};

export type MockModeEndpoint = keyof MockModeConfiguration;
