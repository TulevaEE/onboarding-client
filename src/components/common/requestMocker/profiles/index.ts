import { fundPensionStatusProfiles } from './fundPensionStatus';
import { memberCapitalListingsProfiles } from './memberCapitalListings';
import { userMockProfiles } from './user';
import { MockModeConfiguration } from '../types';
import { withdrawalsEligibilityProfiles } from './withdrawalsEligibility';
import { conversionMockProfiles } from './conversion';
import { memberCapitalProfiles } from './memberCapital';
import { pendingApplicationsProfiles } from './pendingApplications';

export const mockModeProfiles: Record<keyof MockModeConfiguration, Record<string, unknown>> = {
  withdrawalsEligibility: withdrawalsEligibilityProfiles,
  user: userMockProfiles,
  conversion: conversionMockProfiles,
  memberCapital: memberCapitalProfiles,
  memberCapitalListings: memberCapitalListingsProfiles,
  pendingApplications: pendingApplicationsProfiles,
  fundPensionStatus: fundPensionStatusProfiles,
} as const;

export const getAllProfileNames = () =>
  Object.keys(mockModeProfiles) as (keyof MockModeConfiguration)[];

export const getProfileOptions = (key: keyof MockModeConfiguration) =>
  Object.keys(mockModeProfiles[key]);

export const getAllProfileKeys = () => {
  const profileSets = Object.values(mockModeProfiles);

  return profileSets.map((profileSet) => Object.keys(profileSet));
};
