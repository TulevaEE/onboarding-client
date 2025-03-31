import { mockUser } from '../../../../test/backend-responses';
import { User } from '../../apiModels';

export const userMockProfiles: Record<string, User> = {
  NO_SECOND_THIRD_PILLAR: {
    ...mockUser,
    secondPillarActive: false,
    secondPillarOpenDate: null as unknown as string,
    thirdPillarActive: false,
    thirdPillarInitDate: null as unknown as string,
  },

  SECOND_NO_THIRD_PILLAR: {
    ...mockUser,
    thirdPillarActive: false,
    thirdPillarInitDate: null as unknown as string,
  },

  THIRD_NO_SECOND_PILLAR: {
    ...mockUser,
    secondPillarActive: false,
    secondPillarOpenDate: null as unknown as string,
  },
  ALL_PILLARS: {
    ...mockUser,
  },
} as const;
