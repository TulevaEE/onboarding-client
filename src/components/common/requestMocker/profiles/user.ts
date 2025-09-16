import { mockUser } from '../../../../test/backend-responses';
import { User } from '../../apiModels';

export const userMockProfiles: Record<string, User> = {
  NO_SECOND_NO_THIRD_PILLAR: {
    ...mockUser,
    memberNumber: null,
    secondPillarActive: false,
    secondPillarOpenDate: null as unknown as string,
    thirdPillarActive: false,
    thirdPillarInitDate: null as unknown as string,
  },

  SECOND_NO_THIRD_PILLAR: {
    ...mockUser,
    memberNumber: null,
    thirdPillarActive: false,
    thirdPillarInitDate: null as unknown as string,
  },

  THIRD_NO_SECOND_PILLAR: {
    ...mockUser,
    memberNumber: null,
    secondPillarActive: false,
    secondPillarOpenDate: null as unknown as string,
  },
  ALL_PILLARS: {
    ...mockUser,
  },
  ALL_PILLARS_MEMBER: {
    ...mockUser,
    memberNumber: 123,
  },
  PAYMENT_RATE_2: {
    ...mockUser,
    secondPillarPaymentRates: { current: 2, pending: null },
  },
  PAYMENT_RATE_4: {
    ...mockUser,
    secondPillarPaymentRates: { current: 4, pending: null },
  },
  PAYMENT_RATE_6: {
    ...mockUser,
    secondPillarPaymentRates: { current: 6, pending: null },
  },
  PAYMENT_RATE_2_TO_2: {
    ...mockUser,
    secondPillarPaymentRates: { current: 2, pending: 2 },
  },
  PAYMENT_RATE_2_TO_4: {
    ...mockUser,
    secondPillarPaymentRates: { current: 2, pending: 4 },
  },
  PAYMENT_RATE_2_TO_6: {
    ...mockUser,
    secondPillarPaymentRates: { current: 2, pending: 6 },
  },
  PAYMENT_RATE_4_TO_2: {
    ...mockUser,
    secondPillarPaymentRates: { current: 4, pending: 2 },
  },
  PAYMENT_RATE_4_TO_4: {
    ...mockUser,
    secondPillarPaymentRates: { current: 4, pending: 4 },
  },
  PAYMENT_RATE_4_TO_6: {
    ...mockUser,
    secondPillarPaymentRates: { current: 4, pending: 6 },
  },
  PAYMENT_RATE_6_TO_2: {
    ...mockUser,
    secondPillarPaymentRates: { current: 6, pending: 2 },
  },
  PAYMENT_RATE_6_TO_4: {
    ...mockUser,
    secondPillarPaymentRates: { current: 6, pending: 4 },
  },
  PAYMENT_RATE_6_TO_6: {
    ...mockUser,
    secondPillarPaymentRates: { current: 6, pending: 6 },
  },
} as const;
