import { mockUser } from '../../../../test/backend-responses';
import { SecondPillarContributions, User } from '../../apiModels';

const contributionsEndedIn2021: SecondPillarContributions = {
  contributing: false,
  restartDate: null,
  rejoinPossibleFrom: '2026-09-01',
};

const contributionsEndedIn2023: SecondPillarContributions = {
  contributing: false,
  restartDate: null,
  rejoinPossibleFrom: '2028-09-01',
};

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
  // 6% rate but not a member: the one combination that makes the membership nudge show.
  PAYMENT_RATE_6_NON_MEMBER: {
    ...mockUser,
    secondPillarPaymentRates: { current: 6, pending: null },
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
    secondPillarContributions: contributionsEndedIn2021,
    secondPillarPaymentRates: { current: 6, pending: null },
  },
  // The rate most leavers still have on file, as they left before 4% and 6% existed.
  LEFT_SECOND_PILLAR_PAYMENT_RATE_2: {
    ...mockUser,
    secondPillarActive: false,
    secondPillarContributions: contributionsEndedIn2021,
    secondPillarPaymentRates: { current: 2, pending: null },
  },
  // A leaver as the register reports most of them: the fund choice stays on record, so the
  // II pillar reads as active although no contributions are made.
  LEFT_SECOND_PILLAR_FUND_ON_RECORD: {
    ...mockUser,
    secondPillarActive: true,
    secondPillarContributions: contributionsEndedIn2021,
    secondPillarPaymentRates: { current: 2, pending: null },
  },
  LEFT_SECOND_PILLAR_FUND_ON_RECORD_IN_2023: {
    ...mockUser,
    secondPillarActive: true,
    secondPillarContributions: contributionsEndedIn2023,
    secondPillarPaymentRates: { current: 2, pending: null },
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
