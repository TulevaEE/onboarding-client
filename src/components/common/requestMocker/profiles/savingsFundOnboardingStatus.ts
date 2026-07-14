import { SavingsFundOnboardingStatus } from '../../apiModels';

export const savingsFundOnboardingStatusProfiles: Record<string, SavingsFundOnboardingStatus> = {
  NOT_STARTED: { status: null },
  PENDING: { status: 'PENDING' },
  COMPLETED: { status: 'COMPLETED' },
  REJECTED: { status: 'REJECTED' },
};
