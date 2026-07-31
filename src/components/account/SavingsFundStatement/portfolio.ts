import moment from 'moment';
import { NavValue, Transaction } from '../../common/apiModels';

export type NavHistoryByIsin = Record<string, NavValue[]>;

export interface ValuePoint {
  date: string;
  value: number;
}

export interface PeriodSummary {
  from: string;
  to: string;
  startValue: number;
  endValue: number;
  contributions: number;
  withdrawals: number;
  gain: number;
  gainPercentage: number;
  series: ValuePoint[];
}

export interface Layer {
  id: string;
  isins: string[];
}

export interface StackedPoint {
  date: string;
  /** One value per layer, in the order the layers were given. */
  values: number[];
  total: number;
}

const isAcquisition = (transaction: Transaction): boolean =>
  transaction.type === 'CONTRIBUTION_CASH' || transaction.type === 'CONTRIBUTION_CASH_WORKPLACE';

/** Calendar day of a transaction, so it can be compared with the YYYY-MM-DD nav dates. */
const dayOf = (transaction: Transaction): string => moment(transaction.time).format('YYYY-MM-DD');

const signedUnits = (transaction: Transaction): number =>
  isAcquisition(transaction) ? Math.abs(transaction.units) : -Math.abs(transaction.units);

/** Latest published unit price on or before the given date, or null if none is known yet. */
export const navAt = (navHistory: NavValue[], date: string): number | null => {
  let latestDate: string | null = null;
  let price: number | null = null;
  navHistory.forEach((nav) => {
    if (nav.date <= date && (latestDate === null || nav.date > latestDate)) {
      latestDate = nav.date;
      price = nav.value;
    }
  });
  return price;
};

export const unitsAt = (transactions: Transaction[], isin: string, date: string): number =>
  transactions
    .filter((transaction) => transaction.isin === isin && dayOf(transaction) <= date)
    .reduce((units, transaction) => units + signedUnits(transaction), 0);

/**
 * Value of the given funds on a date, or null when a fund is held but has no published
 * price yet. Returning null keeps unpriced holdings off the chart instead of drawing them
 * as zero, which would show up as a cliff on the day their price history begins.
 */
export const valueAt = (
  transactions: Transaction[],
  navHistoryByIsin: NavHistoryByIsin,
  isins: string[],
  date: string,
): number | null =>
  isins.reduce<number | null>((total, isin) => {
    if (total === null) {
      return null;
    }
    const units = unitsAt(transactions, isin, date);
    if (units === 0) {
      return total;
    }
    const nav = navAt(navHistoryByIsin[isin] ?? [], date);
    return nav === null ? null : total + units * nav;
  }, 0);

const cashFlowBetween = (
  transactions: Transaction[],
  isins: string[],
  from: string,
  to: string,
) => {
  const inPeriod = transactions.filter(
    (transaction) =>
      isins.includes(transaction.isin) && dayOf(transaction) >= from && dayOf(transaction) <= to,
  );
  return {
    contributions: inPeriod
      .filter(isAcquisition)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
    withdrawals: inPeriod
      .filter((transaction) => !isAcquisition(transaction))
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
  };
};

/** Every date any of the selected funds published a price within the period. */
const pricingDates = (
  navHistoryByIsin: NavHistoryByIsin,
  isins: string[],
  from: string,
  to: string,
): string[] => {
  const dates = new Set<string>();
  isins.forEach((isin) => {
    (navHistoryByIsin[isin] ?? []).forEach((nav) => {
      if (nav.date >= from && nav.date <= to) {
        dates.add(nav.date);
      }
    });
  });
  return Array.from(dates).sort();
};

/**
 * Walks prices and transactions forward once, in step with the dates being plotted, so a
 * decade of daily prices costs one pass rather than a rescan per day.
 */
const sweep = (
  transactions: Transaction[],
  navHistoryByIsin: NavHistoryByIsin,
  isins: string[],
  dates: string[],
): Map<string, { price: number | null; units: number }>[] => {
  const cursors = isins.map((isin) => ({
    isin,
    navs: [...(navHistoryByIsin[isin] ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    navIndex: 0,
    price: null as number | null,
    transactions: transactions
      .filter((transaction) => transaction.isin === isin)
      .map((transaction) => ({ day: dayOf(transaction), units: signedUnits(transaction) }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    transactionIndex: 0,
    units: 0,
  }));

  return dates.map((date) => {
    const snapshot = new Map<string, { price: number | null; units: number }>();

    for (let i = 0; i < cursors.length; i += 1) {
      const cursor = cursors[i];

      while (cursor.navIndex < cursor.navs.length && cursor.navs[cursor.navIndex].date <= date) {
        cursor.price = cursor.navs[cursor.navIndex].value;
        cursor.navIndex += 1;
      }
      while (
        cursor.transactionIndex < cursor.transactions.length &&
        cursor.transactions[cursor.transactionIndex].day <= date
      ) {
        cursor.units += cursor.transactions[cursor.transactionIndex].units;
        cursor.transactionIndex += 1;
      }
      snapshot.set(cursor.isin, { price: cursor.price, units: cursor.units });
    }

    return snapshot;
  });
};

/**
 * Values every layer on the same dates so they can be drawn stacked. Dates where any
 * held fund has no published price are dropped, so a fund whose price history starts
 * late does not appear as a cliff.
 */
export const getStackedSeries = (
  transactions: Transaction[],
  navHistoryByIsin: NavHistoryByIsin,
  layers: Layer[],
  from: string,
  to: string,
): StackedPoint[] => {
  const isins = Array.from(new Set(layers.flatMap((layer) => layer.isins)));
  const dates = pricingDates(navHistoryByIsin, isins, from, to);
  const snapshots = sweep(transactions, navHistoryByIsin, isins, dates);

  return dates
    .map((date, index) => {
      const snapshot = snapshots[index];
      const values: number[] = [];

      for (let layer = 0; layer < layers.length; layer += 1) {
        let layerValue = 0;
        for (let i = 0; i < layers[layer].isins.length; i += 1) {
          const held = snapshot.get(layers[layer].isins[i]);
          if (held && held.units !== 0) {
            if (held.price === null) {
              return null;
            }
            layerValue += held.units * held.price;
          }
        }
        values.push(layerValue);
      }

      return { date, values, total: values.reduce((sum, value) => sum + value, 0) };
    })
    .filter((point): point is StackedPoint => point !== null);
};

export const getPeriodSummary = (
  transactions: Transaction[],
  navHistoryByIsin: NavHistoryByIsin,
  isins: string[],
  from: string,
  to: string,
): PeriodSummary => {
  const dayBeforeFrom = moment(from).subtract(1, 'day').format('YYYY-MM-DD');
  const startValue = valueAt(transactions, navHistoryByIsin, isins, dayBeforeFrom) ?? 0;
  const endValue = valueAt(transactions, navHistoryByIsin, isins, to) ?? 0;
  const { contributions, withdrawals } = cashFlowBetween(transactions, isins, from, to);

  const gain = endValue + withdrawals - startValue - contributions;
  const invested = startValue + contributions;

  return {
    from,
    to,
    startValue,
    endValue,
    contributions,
    withdrawals,
    gain,
    gainPercentage: invested > 0 ? (gain / invested) * 100 : 0,
    series: getStackedSeries(transactions, navHistoryByIsin, [{ id: 'all', isins }], from, to).map(
      (point) => ({ date: point.date, value: point.total }),
    ),
  };
};
