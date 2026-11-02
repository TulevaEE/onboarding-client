import { RejoinPermission } from '../../apiModels';

export const rejoinPermissionProfiles: Record<string, RejoinPermission> = {
  PERMITTED: { permitted: true, decision: 'PERMITTED' },
  NOT_PERMITTED: { permitted: false, decision: 'REFUSED_BY_PENSIONIKESKUS' },
  ENDED_WITHOUT_APPLICATION: {
    permitted: false,
    decision: 'CONTRIBUTIONS_ENDED_WITHOUT_APPLICATION',
  },
};
