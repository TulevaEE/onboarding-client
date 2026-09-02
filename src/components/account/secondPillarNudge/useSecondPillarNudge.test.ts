import { SourceFund, User } from '../../common/apiModels';
import { mockUser } from '../../../test/backend-responses';
import { qualifiesForSecondPillarNudge } from './useSecondPillarNudge';

const aSourceFund = (overrides: Partial<SourceFund> = {}): SourceFund => ({
  fundManager: { name: 'Tuleva' },
  activeFund: true,
  name: 'Tuleva World Stocks Pension Fund',
  pillar: 2,
  managementFeePercent: 0.34,
  isin: 'EE3600109435',
  price: 15000,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0039,
  contributions: 12345,
  subtractions: 0,
  profit: 2654,
  units: 17000,
  ...overrides,
});

const aUser = (
  paymentRates: User['secondPillarPaymentRates'],
  overrides: Partial<User> = {},
): User => ({
  ...mockUser,
  secondPillarActive: true,
  secondPillarPaymentRates: paymentRates,
  ...overrides,
});

const activeTulevaSecondPillar = [aSourceFund()];

describe('qualifiesForSecondPillarNudge', () => {
  it('qualifies a 2% saver actively contributing to a Tuleva second pillar fund', () => {
    expect(
      qualifiesForSecondPillarNudge(aUser({ current: 2, pending: null }), activeTulevaSecondPillar),
    ).toBe(true);
  });

  it('does not qualify when the current rate is already above 2%', () => {
    expect(
      qualifiesForSecondPillarNudge(aUser({ current: 4, pending: null }), activeTulevaSecondPillar),
    ).toBe(false);
    expect(
      qualifiesForSecondPillarNudge(aUser({ current: 6, pending: null }), activeTulevaSecondPillar),
    ).toBe(false);
  });

  it('does not qualify when a raise to above 2% is already pending', () => {
    expect(
      qualifiesForSecondPillarNudge(aUser({ current: 2, pending: 6 }), activeTulevaSecondPillar),
    ).toBe(false);
  });

  it('does not qualify when the active second pillar fund is not Tuleva', () => {
    const swedbank = [aSourceFund({ fundManager: { name: 'Swedbank' } })];
    expect(qualifiesForSecondPillarNudge(aUser({ current: 2, pending: null }), swedbank)).toBe(
      false,
    );
  });

  it('does not qualify when Tuleva is only the third pillar fund', () => {
    const funds = [
      aSourceFund({ pillar: 3, activeFund: true }),
      aSourceFund({ fundManager: { name: 'Swedbank' }, pillar: 2, activeFund: true }),
    ];
    expect(qualifiesForSecondPillarNudge(aUser({ current: 2, pending: null }), funds)).toBe(false);
  });

  it('does not qualify when the second pillar is inactive', () => {
    expect(
      qualifiesForSecondPillarNudge(
        aUser({ current: 2, pending: null }, { secondPillarActive: false }),
        activeTulevaSecondPillar,
      ),
    ).toBe(false);
  });

  it('does not qualify when data is missing', () => {
    expect(qualifiesForSecondPillarNudge(undefined, activeTulevaSecondPillar)).toBe(false);
    expect(qualifiesForSecondPillarNudge(aUser({ current: 2, pending: null }), undefined)).toBe(
      false,
    );
  });
});
