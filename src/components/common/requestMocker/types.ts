import { fundPensionStatusProfiles } from './profiles/fundPensionStatus';
import { pendingApplicationsProfiles } from './profiles/pendingApplications';
import { conversionMockProfiles } from './profiles/conversion';
import { memberCapitalProfiles } from './profiles/memberCapital';
import { memberCapitalListingsProfiles } from './profiles/memberCapitalListings';
import { userMockProfiles } from './profiles/user';
import { withdrawalsEligibilityProfiles } from './profiles/withdrawalsEligibility';

export type MockModeConfiguration = {
  withdrawalsEligibility: keyof typeof withdrawalsEligibilityProfiles | null;
  user: keyof typeof userMockProfiles | null;
  conversion: keyof typeof conversionMockProfiles | null;
  memberCapital: keyof typeof memberCapitalProfiles | null;
  memberCapitalListings: keyof typeof memberCapitalListingsProfiles | null;
  pendingApplications: keyof typeof pendingApplicationsProfiles | null;
  fundPensionStatus: keyof typeof fundPensionStatusProfiles | null;
};

export type MockModeEndpoint = keyof MockModeConfiguration;
