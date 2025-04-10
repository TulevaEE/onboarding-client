import {
  funds,
  pensionHoldings,
  personalDetails,
  secondPillarSourceFunds,
  TEST_NAVS,
  thirdPillarSourceFunds,
  withdrawalEligibilityFixture,
} from './fixture';
import {
  getAllFundNavsPresent,
  getBankAccountDetails,
  getFundPensionMandatesToCreate,
  getMandatesToCreate,
  getPartialWithdrawalMandatesToCreate,
  getSingleWithdrawalEstimateAfterTax,
  getSingleWithdrawalTaxAmount,
  getSingleWithdrawalTaxRate,
  getYearsToGoUntilEarlyRetirementAge,
} from './utils';

describe('getYearsToGoUntilEarlyRetirementAge', () => {
  it('return correct years to early retirement age', () => {
    expect(getYearsToGoUntilEarlyRetirementAge(undefined)).toBe(0);
    expect(
      getYearsToGoUntilEarlyRetirementAge({
        age: 25,
        hasReachedEarlyRetirementAge: false,
        canWithdrawThirdPillarWithReducedTax: false,
        recommendedDurationYears: 60 - 25 + 20,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(60 - 25);

    expect(
      getYearsToGoUntilEarlyRetirementAge({
        age: 60,
        hasReachedEarlyRetirementAge: true,
        canWithdrawThirdPillarWithReducedTax: true,
        recommendedDurationYears: 20,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(0);

    expect(
      getYearsToGoUntilEarlyRetirementAge({
        age: 65,
        hasReachedEarlyRetirementAge: true,
        canWithdrawThirdPillarWithReducedTax: true,
        recommendedDurationYears: 15,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(0);
  });
});

describe('getSingleWithdrawalTaxRate', () => {
  it('return correct tax rate', () => {
    expect(
      getSingleWithdrawalTaxRate({
        age: 25,
        hasReachedEarlyRetirementAge: false,
        canWithdrawThirdPillarWithReducedTax: false,
        recommendedDurationYears: 50,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(0.22);

    expect(
      getSingleWithdrawalTaxRate({
        age: 55,
        hasReachedEarlyRetirementAge: false,
        canWithdrawThirdPillarWithReducedTax: true,
        recommendedDurationYears: 15,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(0.1);

    expect(
      getSingleWithdrawalTaxRate({
        age: 60,
        hasReachedEarlyRetirementAge: true,
        canWithdrawThirdPillarWithReducedTax: true,
        recommendedDurationYears: 20,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(0.1);
  });
});

describe('getSingleWithdrawalTaxAmount', () => {
  it('return correct tax amount', () => {
    expect(
      getSingleWithdrawalTaxAmount(null, {
        age: 25,
        hasReachedEarlyRetirementAge: false,
        canWithdrawThirdPillarWithReducedTax: false,
        recommendedDurationYears: 50,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(null);

    expect(
      getSingleWithdrawalTaxAmount(10000, {
        age: 25,
        hasReachedEarlyRetirementAge: false,
        canWithdrawThirdPillarWithReducedTax: false,
        recommendedDurationYears: 50,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(2200);

    expect(
      getSingleWithdrawalTaxAmount(10000, {
        age: 55,
        hasReachedEarlyRetirementAge: false,
        canWithdrawThirdPillarWithReducedTax: true,
        recommendedDurationYears: 15,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(1000);

    expect(
      getSingleWithdrawalTaxAmount(10000, {
        age: 60,
        hasReachedEarlyRetirementAge: true,
        canWithdrawThirdPillarWithReducedTax: true,
        recommendedDurationYears: 20,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(1000);
  });
});

describe('getSingleWithdrawalEstimateAfterTax', () => {
  it('return correct amount after tax', () => {
    expect(
      getSingleWithdrawalEstimateAfterTax(null, {
        age: 25,
        hasReachedEarlyRetirementAge: false,
        canWithdrawThirdPillarWithReducedTax: false,
        recommendedDurationYears: 50,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(null);

    expect(
      getSingleWithdrawalEstimateAfterTax(10000, {
        age: 25,
        hasReachedEarlyRetirementAge: false,
        canWithdrawThirdPillarWithReducedTax: false,
        recommendedDurationYears: 50,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(7800);

    expect(
      getSingleWithdrawalEstimateAfterTax(10000, {
        age: 55,
        hasReachedEarlyRetirementAge: false,
        canWithdrawThirdPillarWithReducedTax: true,
        recommendedDurationYears: 15,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(9000);

    expect(
      getSingleWithdrawalEstimateAfterTax(10000, {
        age: 60,
        hasReachedEarlyRetirementAge: true,
        canWithdrawThirdPillarWithReducedTax: true,
        recommendedDurationYears: 20,
        arrestsOrBankruptciesPresent: false,
      }),
    ).toBe(9000);
  });
});

describe('getBankAccountDetails', () => {
  it('returns bank account details', () => {
    expect(
      getBankAccountDetails({ bankAccountIban: 'EE34123123', taxResidencyCode: 'EST' }),
    ).toStrictEqual({
      type: 'ESTONIAN',
      accountIban: 'EE34123123',
    });
  });
});

describe('getAllFundNavsPresent', () => {
  it('returns true if NAVs present', () => {
    expect(getAllFundNavsPresent(funds, secondPillarSourceFunds, thirdPillarSourceFunds)).toBe(
      true,
    );
  });

  it('returns false but doesnt log if funds are loading and NAVs are missing', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(getAllFundNavsPresent([], secondPillarSourceFunds, thirdPillarSourceFunds)).toBe(false);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('returns false if NAVs missing', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(
      getAllFundNavsPresent(
        [
          ...funds,
          {
            isin: 'EE_TEST_ISIN',
            name: 'Tuleva Maailma Aktsiate Pensionifond',
            pillar: 2,
            managementFeeRate: 0.0034,
            ongoingChargesFigure: 0.0047,
            fundManager: { name: 'Tuleva' },
            status: 'ACTIVE',
            inceptionDate: '2017-01-01',
            nav: null,
          },
        ],
        [
          ...secondPillarSourceFunds,
          {
            isin: 'EE_TEST_ISIN',
            price: 1500,
            unavailablePrice: 500,
            activeFund: false,
            currency: 'EUR',
            name: 'Test fund',
            fundManager: { name: 'Tuleva' },
            managementFeePercent: 0.34,
            pillar: 2,
            ongoingChargesFigure: 0.0047,
            contributions: 1000,
            subtractions: 0,
            profit: 500,
            units: 1500,
          },
        ],
        thirdPillarSourceFunds,
      ),
    ).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe('getPartialWithdrawalMandatesToCreate', () => {
  it('returns nothing when withdrawal amount is null', () => {
    expect(
      getPartialWithdrawalMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: true,
          pillarsToWithdrawFrom: 'BOTH',
          singleWithdrawalAmount: null,
        },
        withdrawalEligibilityFixture,
        pensionHoldings,
        funds,
        secondPillarSourceFunds,
        thirdPillarSourceFunds,
      ),
    ).toStrictEqual([]);
  });

  it('returns nothing when withdrawing second pillar and <55', () => {
    const under55Eligibility = {
      hasReachedEarlyRetirementAge: false,
      canWithdrawThirdPillarWithReducedTax: false,
      recommendedDurationYears: 45,
      age: 25,
      arrestsOrBankruptciesPresent: false,
    };

    expect(
      getPartialWithdrawalMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: false,
          pillarsToWithdrawFrom: 'BOTH',
          singleWithdrawalAmount: null,
        },
        under55Eligibility,
        pensionHoldings,
        funds,
        secondPillarSourceFunds,
        thirdPillarSourceFunds,
      ),
    ).toStrictEqual([]);

    expect(
      getPartialWithdrawalMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: false,
          pillarsToWithdrawFrom: 'SECOND',
          singleWithdrawalAmount: null,
        },
        under55Eligibility,
        pensionHoldings,
        funds,
        secondPillarSourceFunds,
        [],
      ),
    ).toStrictEqual([]);
  });

  it('returns correct when withdrawing third pillar and <55', () => {
    const under55Eligibility = {
      hasReachedEarlyRetirementAge: false,
      canWithdrawThirdPillarWithReducedTax: false,
      recommendedDurationYears: 45,
      age: 25,
      arrestsOrBankruptciesPresent: false,
    };

    expect(
      getPartialWithdrawalMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: false,
          pillarsToWithdrawFrom: 'THIRD',
          singleWithdrawalAmount: pensionHoldings.totalThirdPillar,
        },
        under55Eligibility,
        pensionHoldings,
        funds,
        secondPillarSourceFunds,
        thirdPillarSourceFunds,
      ),
    ).toStrictEqual([
      {
        mandateType: 'PARTIAL_WITHDRAWAL',
        pillar: 'THIRD',
        taxResidency: 'EST',
        bankAccountDetails: getBankAccountDetails(personalDetails),
        fundWithdrawalAmounts: [
          { isin: 'EE3600001707', percentage: 100, units: 1000 / TEST_NAVS.TULEVA_THIRD_PILLAR },
          { isin: 'EE3600010294', percentage: 100, units: 400 / TEST_NAVS.LHV_THIRD_PILLAR },
        ],
      },
    ]);
  });

  it('returns correct mandates when withdrawing everything from both pillars', () => {
    const mandates = getPartialWithdrawalMandatesToCreate(
      personalDetails,
      {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'BOTH',
        singleWithdrawalAmount: pensionHoldings.totalBothPillars,
      },
      withdrawalEligibilityFixture,
      pensionHoldings,
      funds,
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
    );

    expect(mandates.length).toBe(2);

    const secondPillarMandate = mandates.find((mandate) => mandate.pillar === 'SECOND');
    const thirdPillarMandate = mandates.find((mandate) => mandate.pillar === 'THIRD');

    expect(secondPillarMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'SECOND',
      taxResidency: 'EST',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        {
          isin: 'EE3600109435',
          percentage: 100,
          units: 1500 / TEST_NAVS.TULEVA_WORLD_SECOND_PILLAR,
        },
        {
          isin: 'EE3600109443',
          percentage: 100,
          units: 800 / TEST_NAVS.TULEVA_BOND_SECOND_PILLAR,
        },
      ],
    });

    expect(thirdPillarMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'THIRD',
      taxResidency: 'EST',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        { isin: 'EE3600001707', percentage: 100, units: 1000 / TEST_NAVS.TULEVA_THIRD_PILLAR },
        { isin: 'EE3600010294', percentage: 100, units: 400 / TEST_NAVS.LHV_THIRD_PILLAR },
      ],
    });
  });

  it('returns correct mandates when proportionally withdrawing 40% of total holdings from both pillars', () => {
    const mandates = getPartialWithdrawalMandatesToCreate(
      personalDetails,
      {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'BOTH',
        singleWithdrawalAmount: pensionHoldings.totalBothPillars * 0.4,
      },
      withdrawalEligibilityFixture,
      pensionHoldings,
      funds,
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
    );

    expect(mandates.length).toBe(2);

    const secondPillarMandate = mandates.find((mandate) => mandate.pillar === 'SECOND');
    const thirdPillarMandate = mandates.find((mandate) => mandate.pillar === 'THIRD');

    expect(secondPillarMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'SECOND',
      taxResidency: 'EST',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        {
          isin: 'EE3600109435',
          percentage: 40,
          units: (1500 / TEST_NAVS.TULEVA_WORLD_SECOND_PILLAR) * 0.4,
        },
        {
          isin: 'EE3600109443',
          percentage: 40,
          units: (800 / TEST_NAVS.TULEVA_BOND_SECOND_PILLAR) * 0.4,
        },
      ],
    });

    expect(thirdPillarMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'THIRD',
      taxResidency: 'EST',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        {
          isin: 'EE3600001707',
          percentage: 40,
          units: (1000 / TEST_NAVS.TULEVA_THIRD_PILLAR) * 0.4,
        },
        { isin: 'EE3600010294', percentage: 40, units: (400 / TEST_NAVS.LHV_THIRD_PILLAR) * 0.4 },
      ],
    });
  });

  it('returns correct mandates when proportionally withdrawing 40% of total holdings only from second pillar', () => {
    const mandates = getPartialWithdrawalMandatesToCreate(
      personalDetails,
      {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'SECOND',
        singleWithdrawalAmount: pensionHoldings.totalSecondPillar * 0.4,
      },
      withdrawalEligibilityFixture,
      pensionHoldings,
      funds,
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
    );

    expect(mandates.length).toBe(1);

    const [secondPillarMandate] = mandates;

    expect(secondPillarMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'SECOND',
      taxResidency: 'EST',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        {
          isin: 'EE3600109435',
          percentage: 40,
          units: (1500 / TEST_NAVS.TULEVA_WORLD_SECOND_PILLAR) * 0.4,
        },
        {
          isin: 'EE3600109443',
          percentage: 40,
          units: (800 / TEST_NAVS.TULEVA_BOND_SECOND_PILLAR) * 0.4,
        },
      ],
    });
  });

  it('returns correct mandates when proportionally withdrawing 40% of total holdings only from third pillar', () => {
    const mandates = getPartialWithdrawalMandatesToCreate(
      personalDetails,
      {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'THIRD',
        singleWithdrawalAmount: pensionHoldings.totalThirdPillar * 0.4,
      },
      withdrawalEligibilityFixture,
      pensionHoldings,
      funds,
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
    );

    expect(mandates.length).toBe(1);

    const [thirdPillarMandate] = mandates;

    expect(thirdPillarMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'THIRD',
      taxResidency: 'EST',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        {
          isin: 'EE3600001707',
          percentage: 40,
          units: (1000 / TEST_NAVS.TULEVA_THIRD_PILLAR) * 0.4,
        },
        { isin: 'EE3600010294', percentage: 40, units: (400 / TEST_NAVS.LHV_THIRD_PILLAR) * 0.4 },
      ],
    });
  });

  it('returns correct mandates and uses unit calculation fallback when units not available', () => {
    const mandates = getPartialWithdrawalMandatesToCreate(
      personalDetails,
      {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'THIRD',
        singleWithdrawalAmount: pensionHoldings.totalThirdPillar,
      },
      withdrawalEligibilityFixture,
      pensionHoldings,
      funds,
      [],
      [
        {
          isin: 'EE3600001707',
          price: 1000,
          unavailablePrice: 500,
          activeFund: false,
          currency: 'EUR',
          name: 'Tuleva III Samba Pensionifond',
          fundManager: { name: 'Tuleva' },
          managementFeePercent: 0.34,
          pillar: 2,
          ongoingChargesFigure: 0.0047,
          contributions: 1000,
          subtractions: 50,
          profit: 300,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          units: null,
        },
        {
          isin: 'EE3600010294',
          price: 400,
          unavailablePrice: 100,
          activeFund: false,
          currency: 'EUR',
          name: 'LHV Pensionifond Aktiivne III',
          fundManager: { name: 'LHV' },
          managementFeePercent: 0.36,
          pillar: 2,
          ongoingChargesFigure: 0.0047,
          contributions: 400,
          subtractions: 0,
          profit: 100,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          units: null,
        },
      ],
    );

    expect(mandates.length).toBe(1);

    const [thirdPillarMandate] = mandates;

    expect(thirdPillarMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'THIRD',
      taxResidency: 'EST',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        {
          isin: 'EE3600001707',
          percentage: 100,
          units: 1000 / TEST_NAVS.TULEVA_THIRD_PILLAR,
        },
        { isin: 'EE3600010294', percentage: 100, units: 400 / TEST_NAVS.LHV_THIRD_PILLAR },
      ],
    });
  });

  test('returns correct mandates when withdrawing below 1 unit', () => {
    const mandates = getPartialWithdrawalMandatesToCreate(
      personalDetails,
      {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'THIRD',
        singleWithdrawalAmount: 1,
      },
      withdrawalEligibilityFixture,
      pensionHoldings,
      funds,
      [],
      thirdPillarSourceFunds,
    );

    expect(mandates.length).toBe(1);

    const [thirdPillarMandate] = mandates;

    expect(thirdPillarMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'THIRD',
      taxResidency: 'EST',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        {
          isin: 'EE3600001707',
          percentage: 0,
          units: 0.5 / TEST_NAVS.TULEVA_THIRD_PILLAR,
        },
        { isin: 'EE3600010294', percentage: 0, units: 0.2 / TEST_NAVS.LHV_THIRD_PILLAR },
      ],
    });
  });
});

describe('getFundPensionMandatesToCreate', () => {
  it('returns nothing when fund pension disabled', () => {
    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: false,
          pillarsToWithdrawFrom: 'BOTH',
          singleWithdrawalAmount: pensionHoldings.totalBothPillars,
        },
        withdrawalEligibilityFixture,
        pensionHoldings,
      ),
    ).toStrictEqual([]);

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: false,
          pillarsToWithdrawFrom: 'SECOND',
          singleWithdrawalAmount: pensionHoldings.totalSecondPillar,
        },
        withdrawalEligibilityFixture,
        pensionHoldings,
      ),
    ).toStrictEqual([]);

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: false,
          pillarsToWithdrawFrom: 'THIRD',
          singleWithdrawalAmount: pensionHoldings.totalThirdPillar,
        },
        withdrawalEligibilityFixture,
        pensionHoldings,
      ),
    ).toStrictEqual([]);
  });

  it('returns nothing when under 55', () => {
    const under55Eligibility = {
      hasReachedEarlyRetirementAge: false,
      canWithdrawThirdPillarWithReducedTax: false,
      recommendedDurationYears: 45,
      age: 25,
      arrestsOrBankruptciesPresent: false,
    };

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: false,
          pillarsToWithdrawFrom: 'BOTH',
          singleWithdrawalAmount: pensionHoldings.totalBothPillars,
        },
        under55Eligibility,
        pensionHoldings,
      ),
    ).toStrictEqual([]);

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: true, // safeguard against potential buggy state
          pillarsToWithdrawFrom: 'BOTH',
          singleWithdrawalAmount: null,
        },
        under55Eligibility,
        pensionHoldings,
      ),
    ).toStrictEqual([]);

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: false,
          pillarsToWithdrawFrom: 'SECOND',
          singleWithdrawalAmount: pensionHoldings.totalSecondPillar,
        },
        under55Eligibility,
        pensionHoldings,
      ),
    ).toStrictEqual([]);

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: false,
          pillarsToWithdrawFrom: 'THIRD',
          singleWithdrawalAmount: pensionHoldings.totalThirdPillar,
        },
        under55Eligibility,
        pensionHoldings,
      ),
    ).toStrictEqual([]);
  });

  it('returns nothing when withdrawing everything already with partial withdrawal', () => {
    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: true,
          pillarsToWithdrawFrom: 'BOTH',
          singleWithdrawalAmount: pensionHoldings.totalBothPillars,
        },
        withdrawalEligibilityFixture,
        pensionHoldings,
      ),
    ).toStrictEqual([]);

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: true,
          pillarsToWithdrawFrom: 'SECOND',
          singleWithdrawalAmount: pensionHoldings.totalSecondPillar,
        },
        withdrawalEligibilityFixture,
        pensionHoldings,
      ),
    ).toStrictEqual([]);

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          fundPensionEnabled: true,
          pillarsToWithdrawFrom: 'THIRD',
          singleWithdrawalAmount: pensionHoldings.totalThirdPillar,
        },
        withdrawalEligibilityFixture,
        pensionHoldings,
      ),
    ).toStrictEqual([]);
  });

  it('returns fund pension mandates when withdrawing from both pillars', () => {
    const mandates = getFundPensionMandatesToCreate(
      personalDetails,
      {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'BOTH',
        singleWithdrawalAmount: null,
      },
      withdrawalEligibilityFixture,
      pensionHoldings,
    );

    expect(mandates.length).toBe(2);

    const secondPillarMandate = mandates.find((mandate) => mandate.pillar === 'SECOND');
    const thirdPillarMandate = mandates.find((mandate) => mandate.pillar === 'THIRD');

    expect(secondPillarMandate).toStrictEqual({
      mandateType: 'FUND_PENSION_OPENING',
      pillar: 'SECOND',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      duration: {
        durationYears: 20,
        recommendedDuration: true,
      },
    });

    expect(thirdPillarMandate).toStrictEqual({
      mandateType: 'FUND_PENSION_OPENING',
      pillar: 'THIRD',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      duration: {
        durationYears: 20,
        recommendedDuration: true,
      },
    });
  });

  it('returns fund pension mandates when withdrawing from second', () => {
    const mandates = getFundPensionMandatesToCreate(
      personalDetails,
      {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'SECOND',
        singleWithdrawalAmount: null,
      },
      withdrawalEligibilityFixture,
      pensionHoldings,
    );

    expect(mandates.length).toBe(1);
    const [secondPillarMandate] = mandates;

    expect(secondPillarMandate).toStrictEqual({
      mandateType: 'FUND_PENSION_OPENING',
      pillar: 'SECOND',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      duration: {
        durationYears: 20,
        recommendedDuration: true,
      },
    });
  });

  it('returns fund pension mandates when withdrawing from third', () => {
    const mandates = getFundPensionMandatesToCreate(
      personalDetails,
      {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'THIRD',
        singleWithdrawalAmount: null,
      },
      withdrawalEligibilityFixture,
      pensionHoldings,
    );

    expect(mandates.length).toBe(1);
    const [thirdPillarMandate] = mandates;

    expect(thirdPillarMandate).toStrictEqual({
      mandateType: 'FUND_PENSION_OPENING',
      pillar: 'THIRD',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      duration: {
        durationYears: 20,
        recommendedDuration: true,
      },
    });
  });
});

describe('getMandatesToCreate', () => {
  it('returns mandates to create when doing 10% partial withdrawal', () => {
    const mandates = getMandatesToCreate({
      personalDetails,
      amountStep: {
        fundPensionEnabled: true,
        pillarsToWithdrawFrom: 'BOTH',
        singleWithdrawalAmount: pensionHoldings.totalBothPillars * 0.1,
      },
      pensionHoldings,
      funds,
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
      eligibility: withdrawalEligibilityFixture,
    });

    expect(mandates?.length).toBe(4);

    const secondPillarWithdrawalMandate = mandates?.find(
      (mandate) => mandate.pillar === 'SECOND' && mandate.mandateType === 'PARTIAL_WITHDRAWAL',
    );
    const thirdPillarWithdrawalMandate = mandates?.find(
      (mandate) => mandate.pillar === 'THIRD' && mandate.mandateType === 'PARTIAL_WITHDRAWAL',
    );

    expect(secondPillarWithdrawalMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'SECOND',
      taxResidency: 'EST',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        {
          isin: 'EE3600109435',
          percentage: 10,
          units: (1500 / TEST_NAVS.TULEVA_WORLD_SECOND_PILLAR) * 0.1,
        },
        {
          isin: 'EE3600109443',
          percentage: 10,
          units: (800 / TEST_NAVS.TULEVA_BOND_SECOND_PILLAR) * 0.1,
        },
      ],
    });

    expect(thirdPillarWithdrawalMandate).toStrictEqual({
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar: 'THIRD',
      taxResidency: 'EST',

      bankAccountDetails: getBankAccountDetails(personalDetails),
      fundWithdrawalAmounts: [
        {
          isin: 'EE3600001707',
          percentage: 10,
          units: (1000 / TEST_NAVS.TULEVA_THIRD_PILLAR) * 0.1,
        },
        { isin: 'EE3600010294', percentage: 10, units: (400 / TEST_NAVS.LHV_THIRD_PILLAR) * 0.1 },
      ],
    });

    const secondPillarFundPensionMandate = mandates?.find(
      (mandate) => mandate.pillar === 'SECOND' && mandate.mandateType === 'FUND_PENSION_OPENING',
    );
    const thirdPillarFundPensionMandate = mandates?.find(
      (mandate) => mandate.pillar === 'THIRD' && mandate.mandateType === 'FUND_PENSION_OPENING',
    );

    expect(secondPillarFundPensionMandate).toStrictEqual({
      mandateType: 'FUND_PENSION_OPENING',
      pillar: 'SECOND',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      duration: {
        durationYears: 20,
        recommendedDuration: true,
      },
    });

    expect(thirdPillarFundPensionMandate).toStrictEqual({
      mandateType: 'FUND_PENSION_OPENING',
      pillar: 'THIRD',
      bankAccountDetails: getBankAccountDetails(personalDetails),
      duration: {
        durationYears: 20,
        recommendedDuration: true,
      },
    });
  });
});
