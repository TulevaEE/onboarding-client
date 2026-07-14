import { fundPensionStatusProfiles } from './profiles/fundPensionStatus';
import { returnsProfiles } from './profiles/returns';
import { savingsFundBalanceProfiles } from './profiles/savingsFundBalance';
import { savingsFundOnboardingStatusProfiles } from './profiles/savingsFundOnboardingStatus';
import { secondPillarAssetsProfiles } from './profiles/secondPillarAssets';
import { transactionsProfiles } from './profiles/transactions';
import { rolesProfiles } from './profiles/roles';
import { sourceFundsProfiles } from './profiles/sourceFunds';
import { pendingApplicationsProfiles } from './profiles/pendingApplications';
import { contributionsProfiles } from './profiles/contributions';
import { conversionMockProfiles } from './profiles/conversion';
import { memberCapitalProfiles } from './profiles/memberCapital';
import { memberCapitalListingsProfiles } from './profiles/memberCapitalListings';
import { userMockProfiles } from './profiles/user';
import { withdrawalsEligibilityProfiles } from './profiles/withdrawalsEligibility';

export type MockModeConfiguration = {
  withdrawalsEligibility: keyof typeof withdrawalsEligibilityProfiles | null;
  user: keyof typeof userMockProfiles | null;
  contributions: keyof typeof contributionsProfiles | null;
  conversion: keyof typeof conversionMockProfiles | null;
  memberCapital: keyof typeof memberCapitalProfiles | null;
  memberCapitalListings: keyof typeof memberCapitalListingsProfiles | null;
  pendingApplications: keyof typeof pendingApplicationsProfiles | null;
  fundPensionStatus: keyof typeof fundPensionStatusProfiles | null;
  returns: keyof typeof returnsProfiles | null;
  savingsFundBalance: keyof typeof savingsFundBalanceProfiles | null;
  savingsFundOnboardingStatus: keyof typeof savingsFundOnboardingStatusProfiles | null;
  secondPillarAssets: keyof typeof secondPillarAssetsProfiles | null;
  transactions: keyof typeof transactionsProfiles | null;
  roles: keyof typeof rolesProfiles | null;
  sourceFunds: keyof typeof sourceFundsProfiles | null;
};

export type MockModeEndpoint = keyof MockModeConfiguration;
