import { fundPensionStatusProfiles } from './fundPensionStatus';
import { memberCapitalListingsProfiles } from './memberCapitalListings';
import { userMockProfiles } from './user';
import { MockModeConfiguration } from '../types';
import { withdrawalsEligibilityProfiles } from './withdrawalsEligibility';
import { contributionsProfiles } from './contributions';
import { conversionMockProfiles } from './conversion';
import { memberCapitalProfiles } from './memberCapital';
import { pendingApplicationsProfiles } from './pendingApplications';
import { returnsProfiles } from './returns';
import { savingsFundBalanceProfiles } from './savingsFundBalance';
import { savingsFundOnboardingStatusProfiles } from './savingsFundOnboardingStatus';
import { secondPillarAssetsProfiles } from './secondPillarAssets';
import { transactionsProfiles } from './transactions';
import { rolesProfiles } from './roles';
import { sourceFundsProfiles } from './sourceFunds';

export const mockModeProfiles: Record<keyof MockModeConfiguration, Record<string, unknown>> = {
  withdrawalsEligibility: withdrawalsEligibilityProfiles,
  user: userMockProfiles,
  contributions: contributionsProfiles,
  conversion: conversionMockProfiles,
  memberCapital: memberCapitalProfiles,
  memberCapitalListings: memberCapitalListingsProfiles,
  pendingApplications: pendingApplicationsProfiles,
  fundPensionStatus: fundPensionStatusProfiles,
  returns: returnsProfiles,
  savingsFundBalance: savingsFundBalanceProfiles,
  savingsFundOnboardingStatus: savingsFundOnboardingStatusProfiles,
  secondPillarAssets: secondPillarAssetsProfiles,
  transactions: transactionsProfiles,
  roles: rolesProfiles,
  sourceFunds: sourceFundsProfiles,
} as const;

export const getAllProfileNames = () =>
  Object.keys(mockModeProfiles) as (keyof MockModeConfiguration)[];

export const getProfileOptions = (key: keyof MockModeConfiguration) =>
  Object.keys(mockModeProfiles[key]);
