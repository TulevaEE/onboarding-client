import { RejoinPermission } from '../../apiModels';

export const rejoinPermissionProfiles: Record<string, RejoinPermission> = {
  PERMITTED: { permitted: true },
  NOT_PERMITTED: { permitted: false },
};
