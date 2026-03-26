import { fundPensionStatusProfiles } from './fundPensionStatus';
import { memberCapitalListingsProfiles } from './memberCapitalListings';
import { userMockProfiles } from './user';
import { MockModeConfiguration } from '../types';
import { withdrawalsEligibilityProfiles } from './withdrawalsEligibility';
import { conversionMockProfiles } from './conversion';
import { memberCapitalProfiles } from './memberCapital';
import { pendingApplicationsProfiles } from './pendingApplications';
import { savingsFundBalanceProfiles } from './savingsFundBalance';
import { transactionsProfiles } from './transactions';

export const mockModeProfiles: Record<keyof MockModeConfiguration, Record<string, unknown>> = {
  withdrawalsEligibility: withdrawalsEligibilityProfiles,
  user: userMockProfiles,
  conversion: conversionMockProfiles,
  memberCapital: memberCapitalProfiles,
  memberCapitalListings: memberCapitalListingsProfiles,
  pendingApplications: pendingApplicationsProfiles,
  fundPensionStatus: fundPensionStatusProfiles,
  savingsFundBalance: savingsFundBalanceProfiles,
  transactions: transactionsProfiles,
} as const;

export const getAllProfileNames = () =>
  Object.keys(mockModeProfiles) as (keyof MockModeConfiguration)[];

export const getProfileOptions = (key: keyof MockModeConfiguration) =>
  Object.keys(mockModeProfiles[key]);
