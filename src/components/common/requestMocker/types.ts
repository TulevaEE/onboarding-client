import { conversionMockProfiles } from './profiles/conversion';
import { memberCapitalProfiles } from './profiles/memberCapital';
import { userMockProfiles } from './profiles/user';
import { withdrawalsEligibilityProfiles } from './profiles/withdrawalsEligibility';

export type MockModeConfiguration = {
  withdrawalsEligibility: keyof typeof withdrawalsEligibilityProfiles | null;
  user: keyof typeof userMockProfiles | null;
  conversion: keyof typeof conversionMockProfiles | null;
  memberCapital: keyof typeof memberCapitalProfiles | null;
};

export type MockModeEndpoint = keyof MockModeConfiguration;
