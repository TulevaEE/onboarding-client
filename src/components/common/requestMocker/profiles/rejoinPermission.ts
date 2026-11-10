import { RejoinPermission } from '../../apiModels';

export const rejoinPermissionProfiles: Record<string, RejoinPermission> = {
  PERMITTED: { permitted: true, decision: 'PERMITTED' },
  NOT_PERMITTED: { permitted: false, decision: 'REFUSED_BY_PENSIONIKESKUS' },
  CANNOT_RESTART: {
    permitted: false,
    decision: 'CONTRIBUTIONS_CANNOT_RESTART',
  },
};
