import { secondPillarSuggestion } from './secondPillarSuggestion';
import {
  mockFunds,
  mockSecondPillarConversion,
  mockUser,
} from '../../../../test/backend-responses';
import { Application, Conversion, User } from '../../../common/apiModels';

const aUser = (overrides: Partial<User> = {}): User => ({ ...mockUser, ...overrides });
const aConversion = (overrides: Partial<Conversion> = {}): Conversion => ({
  ...mockSecondPillarConversion,
  ...overrides,
});

const transferApplication = (
  sourceFundIsin: string,
  status: Application['status'] = 'PENDING',
): Application => {
  const sourceFund = mockFunds.find(({ isin }) => isin === sourceFundIsin);
  if (!sourceFund) {
    throw new Error(`No mock fund with isin: ${sourceFundIsin}`);
  }
  return {
    id: 1,
    status,
    creationTime: '2026-08-17T10:00:00Z',
    type: 'TRANSFER',
    details: {
      sourceFund,
      exchanges: [],
      cancellationDeadline: '2026-08-31T00:00:00Z',
    },
  };
};

const SWEDBANK_SECOND_PILLAR_ISIN = 'EE3600019758';
const TULEVA_THIRD_PILLAR_ISIN = 'EE3600001707';

const elsewhere = { selectionComplete: false, transfersComplete: false };

describe('secondPillarSuggestion', () => {
  const cases: {
    name: string;
    user?: Partial<User>;
    conversion?: Partial<Conversion>;
    applications?: Application[];
    expected: ReturnType<typeof secondPillarSuggestion>;
  }[] = [
    {
      name: 'nothing when second pillar is not active',
      user: { secondPillarActive: false },
      conversion: elsewhere,
      expected: 'NONE',
    },
    {
      name: 'nothing when a withdrawal is pending',
      conversion: { ...elsewhere, pendingWithdrawal: true },
      expected: 'NONE',
    },
    {
      name: 'pending state when a second pillar transfer is already submitted',
      conversion: elsewhere,
      applications: [transferApplication(SWEDBANK_SECOND_PILLAR_ISIN)],
      expected: 'PENDING_TRANSFER',
    },
    {
      name: 'transfer nudge with the fee argument when second pillar is elsewhere in high-fee funds',
      conversion: { ...elsewhere, weightedAverageFee: 0.0065 },
      expected: 'TRANSFER_HIGH_FEE',
    },
    {
      name: 'transfer nudge without the fee argument when second pillar is elsewhere in low-fee funds',
      conversion: { ...elsewhere, weightedAverageFee: 0.0029 },
      expected: 'TRANSFER_LOW_FEE',
    },
    {
      name: 'payment rate nudge when second pillar is at Tuleva with a payment rate below 6%',
      user: { secondPillarPaymentRates: { current: 2, pending: null } },
      expected: 'INCREASE_PAYMENT_RATE',
    },
    {
      name: 'no payment rate nudge when a 6% payment rate is already pending',
      user: { secondPillarPaymentRates: { current: 2, pending: 6 }, memberNumber: null },
      expected: 'MEMBERSHIP',
    },
    {
      name: 'recurring payment nudge when everything else is in place',
      user: { secondPillarPaymentRates: { current: 6, pending: null }, memberNumber: 987 },
      expected: 'RECURRING_PAYMENT',
    },
    {
      name: 'a pending third pillar transfer does not count as a second pillar application',
      conversion: { ...elsewhere, weightedAverageFee: 0.0065 },
      applications: [transferApplication(TULEVA_THIRD_PILLAR_ISIN)],
      expected: 'TRANSFER_HIGH_FEE',
    },
    {
      name: 'a completed second pillar transfer does not count as pending',
      conversion: { ...elsewhere, weightedAverageFee: 0.0065 },
      applications: [transferApplication(SWEDBANK_SECOND_PILLAR_ISIN, 'COMPLETE')],
      expected: 'TRANSFER_HIGH_FEE',
    },
  ];

  test.each(cases)('suggests $expected: $name', ({ user, conversion, applications, expected }) => {
    expect(secondPillarSuggestion(aUser(user), aConversion(conversion), applications || [])).toBe(
      expected,
    );
  });
});
