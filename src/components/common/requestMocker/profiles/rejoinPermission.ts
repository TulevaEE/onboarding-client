import { RejoinPermission } from '../../apiModels';

export const rejoinPermissionProfiles: Record<string, RejoinPermission> = {
  PERMITTED: { permitted: true, contributionsEndedWithoutApplication: false },
  NOT_PERMITTED: { permitted: false, contributionsEndedWithoutApplication: false },
  ENDED_WITHOUT_APPLICATION: { permitted: false, contributionsEndedWithoutApplication: true },
};
