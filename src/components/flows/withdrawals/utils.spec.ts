import {
  funds,
  pensionHoldings,
  personalDetails,
  secondPillarSourceFunds,
  TEST_NAVS,
  thirdPillarSourceFunds,
  withdrawalEligibility,
} from './fixture';
import {
  getBankAccountDetails,
  getFundPensionMandatesToCreate,
  getMandatesToCreate,
  getPartialWithdrawalMandatesToCreate,
} from './utils';

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

describe('getPartialWithdrawalMandatesToCreate', () => {
  it('returns nothing when withdrawal amount is null', () => {
    expect(
      getPartialWithdrawalMandatesToCreate(
        personalDetails,
        {
          pillarsToWithdrawFrom: 'BOTH',
          singleWithdrawalAmount: null,
        },
        pensionHoldings,
        funds,
        secondPillarSourceFunds,
        thirdPillarSourceFunds,
      ),
    ).toStrictEqual([]);
  });

  it('returns correct mandates when withdrawing everything from both pillars', () => {
    const mandates = getPartialWithdrawalMandatesToCreate(
      personalDetails,
      {
        pillarsToWithdrawFrom: 'BOTH',
        singleWithdrawalAmount: pensionHoldings.totalBothPillars,
      },
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
        pillarsToWithdrawFrom: 'BOTH',
        singleWithdrawalAmount: pensionHoldings.totalBothPillars * 0.4,
      },
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
        pillarsToWithdrawFrom: 'SECOND',
        singleWithdrawalAmount: pensionHoldings.totalSecondPillar * 0.4,
      },
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
        pillarsToWithdrawFrom: 'THIRD',
        singleWithdrawalAmount: pensionHoldings.totalThirdPillar * 0.4,
      },
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
});

describe('getFundPensionMandatesToCreate', () => {
  it('returns nothing when withdrawing everything already with partial withdrawal', () => {
    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          pillarsToWithdrawFrom: 'BOTH',
          singleWithdrawalAmount: pensionHoldings.totalBothPillars,
        },
        withdrawalEligibility,
        pensionHoldings,
      ),
    ).toStrictEqual([]);

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          pillarsToWithdrawFrom: 'SECOND',
          singleWithdrawalAmount: pensionHoldings.totalSecondPillar,
        },
        withdrawalEligibility,
        pensionHoldings,
      ),
    ).toStrictEqual([]);

    expect(
      getFundPensionMandatesToCreate(
        personalDetails,
        {
          pillarsToWithdrawFrom: 'THIRD',
          singleWithdrawalAmount: pensionHoldings.totalThirdPillar,
        },
        withdrawalEligibility,
        pensionHoldings,
      ),
    ).toStrictEqual([]);
  });

  it('returns fund pension mandates when withdrawing from both pillars', () => {
    const mandates = getFundPensionMandatesToCreate(
      personalDetails,
      {
        pillarsToWithdrawFrom: 'BOTH',
        singleWithdrawalAmount: null,
      },
      withdrawalEligibility,
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
        pillarsToWithdrawFrom: 'SECOND',
        singleWithdrawalAmount: null,
      },
      withdrawalEligibility,
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
        pillarsToWithdrawFrom: 'THIRD',
        singleWithdrawalAmount: null,
      },
      withdrawalEligibility,
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
      withdrawalAmount: {
        pillarsToWithdrawFrom: 'BOTH',
        singleWithdrawalAmount: pensionHoldings.totalBothPillars * 0.1,
      },
      pensionHoldings,
      funds,
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
      eligibility: withdrawalEligibility,
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
