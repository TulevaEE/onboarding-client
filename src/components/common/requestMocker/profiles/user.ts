import { mockUser } from '../../../../test/backend-responses';
import { User } from '../../apiModels';

export const userMockProfiles: Record<string, User> = {
  NO_SECOND_NO_THIRD_PILLAR: {
    ...mockUser,
    memberNumber: null,
    memberJoinDate: null,
    secondPillarActive: false,
    secondPillarOpenDate: null,
    thirdPillarActive: false,
    thirdPillarInitDate: null,
  },

  SECOND_NO_THIRD_PILLAR: {
    ...mockUser,
    memberNumber: null,
    memberJoinDate: null,
    thirdPillarActive: false,
    thirdPillarInitDate: null,
  },

  THIRD_NO_SECOND_PILLAR: {
    ...mockUser,
    memberNumber: null,
    memberJoinDate: null,
    secondPillarActive: false,
    secondPillarOpenDate: null,
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
  NON_MEMBER: {
    ...mockUser,
    memberNumber: null,
    memberJoinDate: null,
  },
  // Left the funded II pillar: the stored rate is stale, they contribute nothing. The
  // open date inherited from mockUser is what separates them from someone who never
  // joined (THIRD_NO_SECOND_PILLAR, whose open date is null): leaving clears the active
  // date, but the account keeps the date it was opened on.
  LEFT_SECOND_PILLAR: {
    ...mockUser,
    secondPillarActive: false,
    secondPillarPaymentRates: { current: 6, pending: null },
  },
  PAST_RETIREMENT_AGE: {
    ...mockUser,
    age: 65,
    retirementAge: 60,
  },
  LEGAL_ENTITY: {
    ...mockUser,
    role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Test OÜ' },
    secondPillarActive: false,
    secondPillarOpenDate: null,
    thirdPillarActive: false,
    thirdPillarInitDate: null,
    memberNumber: null,
    memberJoinDate: null,
  },
} as const;
