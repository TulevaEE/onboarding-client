import { SecondPillarAssets } from '../../apiModels';

const empty: Omit<SecondPillarAssets, 'balance'> = {
  pikFlag: false,
  employeeWithheldPortion: 0,
  socialTaxPortion: 0,
  additionalParentalBenefit: 0,
  interest: 0,
  compensation: 0,
  insurance: 0,
  corrections: 0,
  inheritance: 0,
  withdrawals: 0,
  transferredToPik: 0,
};

export const secondPillarAssetsProfiles: Record<string, SecondPillarAssets> = {
  TEST_1_NORMAL_POSITIVE: {
    ...empty,
    balance: 15698.36,
    employeeWithheldPortion: 5531.39,
    socialTaxPortion: 8782.61,
  },

  TEST_2_NEGATIVE_GROWTH: {
    ...empty,
    balance: 14700.5,
    employeeWithheldPortion: 4903.95,
    socialTaxPortion: 9807.09,
  },

  TEST_3_FULLY_WITHDRAWN: {
    ...empty,
    balance: 0,
    employeeWithheldPortion: 1696.38,
    socialTaxPortion: 2923.2,
    insurance: 310,
    withdrawals: 7160.25,
  },

  TEST_4_PARTIAL_WITHDRAWAL_NEGATIVE: {
    ...empty,
    balance: 53,
    employeeWithheldPortion: 1096.38,
    socialTaxPortion: 2323.2,
    insurance: 350,
    withdrawals: 3500.25,
  },

  TEST_5_PARENTAL_LEAVE_ONLY: {
    ...empty,
    balance: 425.7,
    additionalParentalBenefit: 396.5,
  },

  TEST_6_PIK_CONVERSION: {
    ...empty,
    pikFlag: true,
    balance: 0,
    employeeWithheldPortion: 2115.75,
    socialTaxPortion: 4737.2,
    transferredToPik: 5000,
  },

  TEST_7_LONG_TERM_SAVER: {
    ...empty,
    balance: 46048.71,
    employeeWithheldPortion: 9419.9,
    socialTaxPortion: 16453.08,
  },

  TEST_8_INHERITED: {
    ...empty,
    balance: 28120.45,
    employeeWithheldPortion: 8042.15,
    socialTaxPortion: 13056.3,
    inheritance: 5000,
    // expected: sinu 8 042 / riik+muud 18 056 (13 056 + 5 000 inheritance) / tootlus +2 022
  },

  TEST_9_PENSIONILEPING_UNWOUND: {
    ...empty,
    balance: 12500,
    employeeWithheldPortion: 4000,
    socialTaxPortion: 6500,
    withdrawals: 3000,
    insurance: 2700,
    // bought pensionileping for 3 000 €, surrendered and got 2 700 € back
    // net väljamakstud = −300 €
  },
};
