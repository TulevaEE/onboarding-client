import moment from 'moment';
import { Transaction } from '../../apiModels';

export const transactionsProfiles: Record<string, Transaction[]> = {
  SAVINGS_FUND_DEPOSITS: [
    {
      id: 'tx-1',
      amount: 500,
      currency: 'EUR',
      time: moment().subtract(1, 'week').toISOString(),
      isin: 'EE0000003283',
      type: 'CONTRIBUTION_CASH',
      units: 446.4,
      nav: 1.12,
    },
    {
      id: 'tx-2',
      amount: 250,
      currency: 'EUR',
      time: moment().subtract(1, 'month').toISOString(),
      isin: 'EE0000003283',
      type: 'CONTRIBUTION_CASH',
      units: 225.2,
      nav: 1.11,
    },
  ],
  EMPTY: [],
};
