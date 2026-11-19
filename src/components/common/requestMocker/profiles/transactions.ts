import moment from 'moment';
import { Transaction } from '../../apiModels';

const SAVINGS_FUND_ISIN = 'EE0000003283';

const previousDay = (time: string) => moment(time).subtract(1, 'day').format('YYYY-MM-DD');

const yearsAgo = (years: number, month: number, day: number) =>
  moment().subtract(years, 'year').month(month).date(day).startOf('day').toISOString();

const signedAmount = (units: number, nav: number, type: Transaction['type']) => {
  const value = Number((units * nav).toFixed(2));
  return type === 'SUBTRACTION' ? -value : value;
};

const savingsFundTransaction = (
  id: string,
  time: string,
  units: number,
  nav: number,
  type: Transaction['type'],
): Transaction => ({
  id,
  amount: signedAmount(units, nav, type),
  currency: 'EUR',
  time,
  navDate: previousDay(time),
  priceCalculationDate: moment(time).format('YYYY-MM-DD'),
  applicationTime: moment(time).subtract(1, 'day').toISOString(),
  counterpartyIban: 'EE651010220306497226',
  isin: SAVINGS_FUND_ISIN,
  type,
  units,
  nav,
});

const savingsFundTransfer = (
  id: string,
  time: string,
  units: number,
  amount: number,
  type: 'TRANSFER_IN' | 'TRANSFER_OUT',
  acquisitionCost?: number,
): Transaction => ({
  id,
  amount,
  currency: 'EUR',
  time,
  navDate: previousDay(time),
  priceCalculationDate: null,
  applicationTime: null,
  counterpartyIban: null,
  isin: SAVINGS_FUND_ISIN,
  type,
  units,
  nav: null,
  ...(acquisitionCost !== undefined && { acquisitionCost }),
});

const parent = { name: 'Kati Kask', iban: 'EE382200221020145685', isOwnAccount: false };
const minor = { name: 'Mari Maasikas', iban: 'EE381010220306497227', isOwnAccount: true };
const grandmother = { name: 'Mai Maasikas', iban: 'EE471000001020145685', isOwnAccount: false };

const depositToMinor = (
  id: string,
  day: string,
  amount: number,
  nav: number,
  remitter: typeof parent,
): Transaction => ({
  id,
  amount,
  currency: 'EUR',
  time: `${day}T09:00:00Z`,
  navDate: previousDay(day),
  priceCalculationDate: day,
  applicationTime: `${previousDay(day)}T12:00:00Z`,
  counterpartyIban: remitter.iban,
  isin: SAVINGS_FUND_ISIN,
  type: 'CONTRIBUTION_CASH',
  units: Number((amount / nav).toFixed(3)),
  nav,
  remitterName: remitter.name,
  paidFromOwnAccount: remitter.isOwnAccount,
});

export const transactionsProfiles: Record<string, Transaction[]> = {
  SAVINGS_FUND_DEPOSITS: [
    {
      id: 'tx-1',
      amount: 500,
      currency: 'EUR',
      time: moment().subtract(1, 'week').toISOString(),
      navDate: moment().subtract(1, 'week').subtract(1, 'day').format('YYYY-MM-DD'),
      priceCalculationDate: moment().subtract(1, 'week').format('YYYY-MM-DD'),
      applicationTime: moment().subtract(1, 'week').subtract(1, 'day').toISOString(),
      counterpartyIban: 'EE651010220306497226',
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
      navDate: moment().subtract(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
      priceCalculationDate: moment().subtract(1, 'month').format('YYYY-MM-DD'),
      applicationTime: moment().subtract(1, 'month').subtract(1, 'day').toISOString(),
      counterpartyIban: 'EE651010220306497226',
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
    savingsFundTransfer('hist-8', yearsAgo(0, 5, 18), 15, 168.75, 'TRANSFER_IN', 150),
    savingsFundTransfer('hist-9', yearsAgo(0, 6, 4), 10, -112.5, 'TRANSFER_OUT'),
  ],
  EMPTY: [],
  MINOR_SAVINGS_FUND: [
    depositToMinor('minor-4', '2026-08-21', 50, 1.0421, parent),
    depositToMinor('minor-3', '2026-08-18', 100, 1.0388, parent),
    depositToMinor('minor-gift', '2026-08-10', 30, 1.0345, grandmother),
    depositToMinor('minor-2', '2026-08-04', 25, 1.0302, minor),
    depositToMinor('minor-1', '2026-07-17', 1000, 1.025, parent),
  ],
};
