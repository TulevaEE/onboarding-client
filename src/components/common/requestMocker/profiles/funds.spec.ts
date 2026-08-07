import { fundsProfiles } from './funds';

const TULEVA_SECOND_PILLAR_STOCK_FUND_ISIN = 'EE3600109435';
const TULEVA_SECOND_PILLAR_BOND_FUND_ISIN = 'EE3600109443';
const TULEVA_THIRD_PILLAR_FUND_ISIN = 'EE3600001707';
const SAVINGS_FUND_ISIN = 'EE0000003283';

const profileNames = Object.keys(fundsProfiles);

describe('funds mock profiles', () => {
  it.each(profileNames)(
    '%s contains the Tuleva pension funds the rest of the app depends on',
    (profileName) => {
      const isins = fundsProfiles[profileName].map((fund) => fund.isin);

      expect(isins).toContain(TULEVA_SECOND_PILLAR_STOCK_FUND_ISIN);
      expect(isins).toContain(TULEVA_SECOND_PILLAR_BOND_FUND_ISIN);
      expect(isins).toContain(TULEVA_THIRD_PILLAR_FUND_ISIN);
    },
  );

  it.each(profileNames)('%s contains funds of other fund managers', (profileName) => {
    const otherManagerFunds = fundsProfiles[profileName].filter(
      (fund) => fund.fundManager.name !== 'Tuleva',
    );

    expect(otherManagerFunds.length).toBeGreaterThan(0);
  });

  it('only offers the savings fund in the profile named after it', () => {
    expect(fundsProfiles.WITH_SAVINGS_FUND.map((fund) => fund.isin)).toContain(SAVINGS_FUND_ISIN);
    expect(fundsProfiles.WITHOUT_SAVINGS_FUND.map((fund) => fund.isin)).not.toContain(
      SAVINGS_FUND_ISIN,
    );
  });
});
