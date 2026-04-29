import {
  Key,
  ReturnsResponse,
} from '../../../account/ComparisonCalculator/api/returnComparison.types';

export const returnsProfiles: Record<string, ReturnsResponse> = {
  II_PILLAR_15Y_6_VS_7: {
    from: '2011-04-29',
    to: '2026-04-29',
    returns: [
      {
        type: 'PERSONAL',
        key: Key.SECOND_PILLAR,
        rate: 0.06,
        amount: 13000,
        paymentsSum: 20000,
        currency: 'EUR',
      },
      {
        type: 'FUND',
        key: Key.EPI,
        rate: 0.04,
        amount: 7000,
        paymentsSum: 20000,
        currency: 'EUR',
      },
      {
        type: 'INDEX',
        key: Key.UNION_STOCK_INDEX,
        rate: 0.07,
        amount: 15000,
        paymentsSum: 20000,
        currency: 'EUR',
      },
    ],
  },
};
