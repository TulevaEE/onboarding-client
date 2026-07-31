import moment from 'moment';
import { Transaction } from '../../apiModels';

const SAVINGS_FUND_ISIN = 'EE0000003283';

const yearsAgo = (years: number, month: number, day: number) =>
  moment().subtract(years, 'year').month(month).date(day).startOf('day').toISOString();

const savingsFundTransaction = (
  id: string,
  time: string,
  units: number,
  nav: number,
  type: Transaction['type'],
): Transaction => ({
  id,
  amount: Number((units * nav).toFixed(2)),
  currency: 'EUR',
  time,
  isin: SAVINGS_FUND_ISIN,
  type,
  units,
  nav,
});

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
  /** Multi-year history with redemptions, so the statement page has something to show. */
  SAVINGS_FUND_HISTORY: [
    savingsFundTransaction('hist-1', yearsAgo(2, 1, 15), 100, 10, 'CONTRIBUTION_CASH'),
    savingsFundTransaction('hist-2', yearsAgo(2, 5, 3), 50, 10.5, 'CONTRIBUTION_CASH'),
    savingsFundTransaction('hist-3', yearsAgo(1, 0, 20), 80, 11.2, 'CONTRIBUTION_CASH'),
    savingsFundTransaction('hist-4', yearsAgo(1, 8, 10), 40, 12, 'SUBTRACTION'),
    savingsFundTransaction('hist-5', yearsAgo(1, 10, 5), 30, 11.8, 'CONTRIBUTION_CASH'),
    savingsFundTransaction('hist-6', yearsAgo(0, 2, 12), 25, 12.5, 'CONTRIBUTION_CASH'),
    savingsFundTransaction('hist-7', yearsAgo(0, 4, 2), 20, 12.6, 'SUBTRACTION'),
  ],
  EMPTY: [],
};
